// backend/src/routes/invoices/list.ts
import { Request, Response } from "express";
import { query, queryOne } from "../../database.js";
import { getOffset, createPageToken, handleDbError } from "../../common.js";
import { rowToInvoice } from "./helpers.js";

/**
 * GET /api/invoices?limit=&pageToken=&status=&clientId=&order=desc
 */
export async function listInvoices(req: Request, res: Response) {
  try {
    const {
      limit: limitRaw,
      pageToken,
      status,
      clientId,
      order = "desc",
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(Math.max(Number(limitRaw || 25), 1), 500);
    const offset = getOffset(pageToken);

    let sql = "SELECT * FROM invoices WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      sql += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (clientId) {
      sql += ` AND client_id = $${paramCount}`;
      params.push(clientId);
      paramCount++;
    }

    sql += ` ORDER BY created_at ${order === "asc" ? "ASC" : "DESC"}`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const invoices = await query(sql, params);

    // Convert to Invoice format with items
    const invoicesWithItems = await Promise.all(
      invoices.map((inv) => rowToInvoice(inv))
    );

    // Check if there are more records
    let countSql = "SELECT COUNT(*) as count FROM invoices WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 1;

    if (status) {
      countSql += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    if (clientId) {
      countSql += ` AND client_id = $${countParamCount}`;
      countParams.push(clientId);
      countParamCount++;
    }

    const totalCount = await queryOne<{ count: string }>(countSql, countParams);
    const total = totalCount ? parseInt(totalCount.count) : 0;
    const hasMore = offset + limit < total;

    res.json({
      items: invoicesWithItems,
      nextPageToken: createPageToken(offset, limit, hasMore),
      nextCursor: invoices.length > 0 ? invoices[invoices.length - 1].created_at : undefined,
    });
  } catch (err: any) {
    console.error("GET /invoices error", err);
    handleDbError(err, res);
  }
}


