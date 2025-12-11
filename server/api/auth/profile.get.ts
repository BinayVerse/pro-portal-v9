import { defineEventHandler } from 'h3';
import { query } from '../../utils/db';
import { CustomError } from '../../utils/custom.error';
import jwt from 'jsonwebtoken';

// Mapping entitlement → internal plan title
const ENTITLEMENT_PLAN_MAP: Record<string, string> = {
  BasicTier: "Starter",
  ProfessionalTier: "Professional",
  CustomTier: "Enterprise"
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  /** -----------------------------------
   * TOKEN PARSING & VALIDATION
   * ----------------------------------- **/
  let token = event.node.req.headers['authorization']?.split(' ')[1];

  if (!token) {
    const cookies = String(event.node.req.headers['cookie'] || '');
    token = cookies.split(';')
      .map(c => c.trim().split('='))
      .filter(([key]) => key === 'auth-token' || key === 'authToken')
      .map(([, value]) => decodeURIComponent(value))
      .shift();
  }

  if (!token) throw new CustomError('Unauthorized: No token provided', 401);

  let userId: string;
  try {
    const decoded = jwt.verify(token, config.jwtToken as string) as { user_id: string };
    userId = decoded.user_id;
  } catch (err) {
    console.error('Token verification error:', err);
    throw new CustomError('Unauthorized: Invalid token', 401);
  }

  if (!userId) throw new CustomError('Unauthorized: User ID missing in token', 401);

  /** -----------------------------------
   * FETCH USER + CURRENT PLAN
   * ----------------------------------- **/
  const userQuery = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.contact_number,
      u.primary_contact,
      u.org_id,
      u.role_id,

      -- PLAN & ORG INFO
      o.plan_id,
      COALESCE(o.org_name, '') AS company,

      -- NEW ORG-LEVEL LIMIT FIELDS
      o.org_users,
      o.org_limit_requests,
      o.org_storage_limit_gb,
      o.org_artefacts,
      o.org_unlimited_requests,
      o.source
    FROM users u
    LEFT JOIN organizations o ON u.org_id = o.org_id
    WHERE u.user_id = $1
  `;


  try {
    const { rows } = await query(userQuery, [userId]);
    if (!rows.length) throw new CustomError('User or Organization not found', 404);

    const user = rows[0];

    // Values that will be returned
    let finalPlanId = user.plan_id || null;
    let finalPlanName: string | null = null;

    /** -----------------------------------
     * ELIGIBLE FOR PLAN SYNC?
     * ----------------------------------- **/
    if (user.org_id) {

      const subscriptionRes = await query(
        `SELECT customer_id FROM aws_marketplace_subscriptions WHERE org_id = $1 LIMIT 1`,
        [user.org_id]
      );

      const subscription = subscriptionRes.rows[0];

      if (subscription?.customer_id) {
        const entitlementRes = await query(
          `SELECT dimension, updated_at, expiry_date, plan_type FROM aws_marketplace_entitlements WHERE customer_id = $1 LIMIT 1`,
          [subscription.customer_id]
        );

        const entitlement = entitlementRes.rows[0];

        if (entitlement?.dimension) {
          const mappedPlanTitle = ENTITLEMENT_PLAN_MAP[entitlement.dimension];

          if (mappedPlanTitle) {
            const planRes = await query(
              `
                SELECT 
                    id,
                    users,
                    limit_requests,
                    storage_limit_gb,
                    artefacts 
                  FROM plans
                  WHERE title = $1 AND LOWER(duration) = LOWER($2) AND active = TRUE 
                  LIMIT 1
              `,
              [mappedPlanTitle, entitlement.plan_type]
            );

            const plan = planRes.rows[0];

            if (plan && plan.id) {
              if (user.plan_id && user.plan_id === plan.id) {
                // console.log(`nothing to update, plan already set`);
                finalPlanId = plan.id;
                finalPlanName = mappedPlanTitle;
              } else {
                console.log(`plan mismatch, updating plan to ${mappedPlanTitle}`);
                //
                // Update organization with BOTH plan_id AND org-level limits
                //
                await query(
                  `
                    UPDATE organizations
                    SET plan_id = $1,
                        plan_start_date = ($2::timestamp - INTERVAL '30 days'),
                        org_users = $4,
                        org_limit_requests = $5,
                        org_storage_limit_gb = $6,
                        org_artefacts = $7,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE org_id = $3
                  `,
                  [
                    plan.id,
                    entitlement.expiry_date,
                    user.org_id,

                    // ORG LIMITS mapped from the plan
                    plan.users ?? null,
                    plan.limit_requests ?? null,
                    plan.storage_limit_gb ?? null,
                    plan.artefacts ?? null,
                  ]
                );

                // Insert or update subscription_details record
                await query(
                  `
                    INSERT INTO subscription_details (org_id, plan_id, status, metadata)
                    VALUES ($1, $2, $3, $4)
                  `,
                  [
                    user.org_id,
                    plan.id,
                    'active',
                    JSON.stringify({
                      orgId: user.org_id,
                      orgName: user.company,
                      planId: plan.id,
                      planName: mappedPlanTitle,
                      planType: entitlement.plan_type,
                      source: "aws",
                      syncedAt: new Date().toISOString()
                    })
                  ]
                );

                const updatedPlanRes = await query(
                  `
                    SELECT o.plan_id, p.title AS plan_name
                    FROM organizations o
                    LEFT JOIN plans p ON o.plan_id = p.id
                    WHERE o.org_id = $1
                    LIMIT 1
                  `,
                  [user.org_id]
                );

                const updatedPlan = updatedPlanRes.rows[0];
                finalPlanId = updatedPlan?.plan_id || null;
                finalPlanName = updatedPlan?.plan_name || null;
              }
            }
          }
        }
      }
    }

    /** -----------------------------------
     * FALLBACK: GET PLAN NAME IF NOT UPDATED ABOVE
     * ----------------------------------- **/
    if (!finalPlanName && finalPlanId) {
      const existingPlanRes = await query(
        `SELECT title FROM plans WHERE id = $1 LIMIT 1`,
        [finalPlanId]
      );
      finalPlanName = existingPlanRes.rows.length ? existingPlanRes.rows[0].title : null;
    }

    /** -----------------------------------
     * GET FULL PLAN DETAILS
     * ----------------------------------- **/
    let planDetails = null;

    if (finalPlanId) {
      const planDetailsRes = await query(
        `
          SELECT 
            id,
            title,
            price_currency,
            price_amount,
            duration,
            users,
            limit_requests,
            add_ons_unlimited_requests,
            add_ons_price,
            features,
            trial_period_days,
            storage_limit_gb,
            support_level,
            artefacts,
            metadata
          FROM plans 
          WHERE id = $1 LIMIT 1
        `,
        [finalPlanId]
      );

      if (planDetailsRes.rows.length) {
        const planRow = planDetailsRes.rows[0];

        planDetails = {
          ...planRow,

          // PRIORITY: ORG LIMITS → THEN PLAN VALUES
          users: user.org_users ?? planRow.users,
          limit_requests: user.org_limit_requests ?? planRow.limit_requests,
          storage_limit_gb: user.org_storage_limit_gb ?? planRow.storage_limit_gb,
          artefacts: user.org_artefacts ?? planRow.artefacts,

          // Unlimited Requests Override
          add_ons_unlimited_requests:
            user.org_unlimited_requests ?? planRow.add_ons_unlimited_requests,
        };
      }
    }

    /** -----------------------------------
     * FETCH BILLING ADDRESS
     * ----------------------------------- **/
    let billingAddress = null;
    if (user.org_id) {
      const billingRes = await query(
        `SELECT
          id, name, contact_number, email, tax_number,
          address_line1, address_line2, address_city,
          address_state, address_zip, address_country, address_phone
        FROM billing_address
        WHERE org_id = $1 LIMIT 1`,
        [user.org_id]
      );

      if (billingRes.rows.length) {
        billingAddress = billingRes.rows[0];
      }
    }

    /** -----------------------------------
     * FINAL RESPONSE
     * ----------------------------------- **/
    return {
      statusCode: 200,
      status: 'success',
      message: 'User profile fetched successfully',
      data: {
        ...user,
        plan_id: finalPlanId,
        plan_name: finalPlanName,
        plan_expiry: null,
        plan_details: planDetails,
        isCompanyRegistered: !!user.org_id,
        billing_address: billingAddress,
      },
    };

  } catch (err) {
    console.error(err);
    throw new CustomError('Failed to fetch user profile', 500);
  }
});
