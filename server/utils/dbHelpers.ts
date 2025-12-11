import { query } from '~/server/utils/db'
import type { H3Event } from 'h3'
import { getOrgFromToken } from './auth';

function extractUuid(value: string): string | null {
    if (!value) return null
    const match = value.match(
        /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/
    )
    return match ? match[0].trim() : null
}

/**
 * ✅ Update organization with Chargebee customer ID and tax number
 */
export async function updateOrganizationCustomer(
    event: H3Event,
    customerId: string,
    taxNumber?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const { orgId } = getOrgFromToken(event)

        const sql = `
      UPDATE public.organizations
      SET 
        chargebee_customer_id = $1,
        tax_number = COALESCE($2, tax_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE org_id = $3
      RETURNING org_id, chargebee_customer_id, tax_number;
    `
        const res = await query(sql, [customerId, taxNumber || null, orgId])
        if (!res.rowCount) throw new Error(`Organization not found: ${orgId}`)

        return { success: true, data: res.rows[0] }
    } catch (error: any) {
        console.error('❌ DB Error: updateOrganizationCustomer failed', {
            error: error.message || error,
        })
        return { success: false, error: error.message || 'Update failed' }
    }
}

/**
 * ✅ Insert billing address
 */
export async function upsertBillingAddress(
    event: H3Event,
    billing: any
): Promise<{ success: boolean; message: string; id?: string; error?: string }> {
    try {
        const { orgId } = getOrgFromToken(event)

        const billingData = {
            org_id: orgId,
            name: `${billing.firstName || ''} ${billing.lastName || ''}`.trim(),
            contact_number: billing.phoneNumber || '',
            email: billing.email || '',
            tax_number: billing.gstNumber || null,
            address_line1: billing.addressLine1 || '',
            address_line2: billing.addressLine2 || '',
            address_city: billing.city || '',
            address_state: billing.region || '',
            address_zip: billing.zipcode || '',
            address_country: billing.country || '',
            address_phone: billing.phoneNumber || '',
        }

        /** -----------------------------------------------------------
         * CHECK IF BILLING ADDRESS ALREADY EXISTS
         * ----------------------------------------------------------- */
        const findExisting = await query(
            `SELECT id FROM billing_address WHERE org_id = $1 LIMIT 1`,
            [orgId]
        )

        /** -----------------------------------------------------------
         * UPDATE CASE
         * ----------------------------------------------------------- */
        if (findExisting.rows.length > 0) {
            const existingId = findExisting.rows[0].id

            const updateSQL = `
                UPDATE billing_address
                SET 
                    name = $1,
                    contact_number = $2,
                    email = $3,
                    tax_number = $4,
                    address_line1 = $5,
                    address_line2 = $6,
                    address_city = $7,
                    address_state = $8,
                    address_zip = $9,
                    address_country = $10,
                    address_phone = $11,
                    updated_at = CURRENT_TIMESTAMP
                WHERE org_id = $12
                RETURNING id
            `

            const params = [
                billingData.name,
                billingData.contact_number,
                billingData.email,
                billingData.tax_number,
                billingData.address_line1,
                billingData.address_line2,
                billingData.address_city,
                billingData.address_state,
                billingData.address_zip,
                billingData.address_country,
                billingData.address_phone,
                billingData.org_id,
            ]

            const updateRes = await query(updateSQL, params)

            return {
                success: true,
                message: 'Billing address updated successfully',
                id: updateRes.rows[0].id,
            }
        }

        /** -----------------------------------------------------------
         * INSERT CASE
         * ----------------------------------------------------------- */
        const insertSQL = `
            INSERT INTO billing_address (
                org_id, name, contact_number, email, tax_number,
                address_line1, address_line2, address_city, 
                address_state, address_zip, address_country, address_phone
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING id
        `

        const insertParams = [
            billingData.org_id,
            billingData.name,
            billingData.contact_number,
            billingData.email,
            billingData.tax_number,
            billingData.address_line1,
            billingData.address_line2,
            billingData.address_city,
            billingData.address_state,
            billingData.address_zip,
            billingData.address_country,
            billingData.address_phone,
        ]

        const insertRes = await query(insertSQL, insertParams)

        return {
            success: true,
            message: 'Billing address created successfully',
            id: insertRes.rows[0].id,
        }

    } catch (err: any) {
        console.error('❌ Billing Address upsert failed:', err)
        return {
            success: false,
            message: err.message || 'Billing update failed',
            error: err.message || 'Billing update failed',
        }
    }
}


/**
 * Update organization subscription
 */
export async function updateOrganizationSubscription(
    event: H3Event,
    planId: string,
    subscriptionId: string,
    metadata: any = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const { orgId } = getOrgFromToken(event);

        await query('BEGIN', []);

        const parsedPlanId = extractUuid(planId);
        if (!parsedPlanId)
            throw new Error(`Invalid planId format: ${planId}`);

        //
        // Fetch plan limits from the plan template
        //
        const planLimitRes = await query(
            `
              SELECT 
                users,
                limit_requests,
                storage_limit_gb,
                artefacts
              FROM plans
              WHERE id = $1
              LIMIT 1
            `,
            [parsedPlanId]
        );

        if (!planLimitRes.rows.length)
            throw new Error(`Plan not found for id: ${parsedPlanId}`);

        const limits = planLimitRes.rows[0];

        //
        // Update organization with plan + org limits
        //
        const updateOrgSql = `
          UPDATE public.organizations
          SET 
            plan_id = $1,
            plan_start_date = CURRENT_TIMESTAMP,
            chargebee_subscription_id = $2,
            org_users = $4,
            org_limit_requests = $5,
            org_storage_limit_gb = $6,
            org_artefacts = $7,
            updated_at = CURRENT_TIMESTAMP
          WHERE org_id = $3
          RETURNING org_id;
        `;

        const res1 = await query(updateOrgSql, [
            parsedPlanId,
            subscriptionId,
            orgId,

            // New org-level fields come from the plan
            limits.users ?? null,
            limits.limit_requests ?? null,
            limits.storage_limit_gb ?? null,
            limits.artefacts ?? null
        ]);

        if (!res1.rowCount)
            throw new Error(`Organization not found for subscription update: ${orgId}`);

        //
        // Log subscription details
        //
        const insertSubSql = `
          INSERT INTO public.subscription_details (org_id, plan_id, status, metadata)
          VALUES ($1, $2, 'active', $3)
          RETURNING id;
        `;

        const res2 = await query(insertSubSql, [
            orgId,
            parsedPlanId,
            JSON.stringify(metadata || {})
        ]);

        if (!res2.rowCount)
            throw new Error('Failed to insert subscription_details record');

        await query('COMMIT', []);
        return { success: true, id: res2.rows[0].id };

    } catch (error: any) {
        await query('ROLLBACK', []);
        console.error('❌ DB Error: updateOrganizationSubscription failed', {
            error: error.message || error,
        });
        return { success: false, error: error.message || 'Update failed' };
    }
}

