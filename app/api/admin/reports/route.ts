import { NextRequest, NextResponse } from "next/server";
import database from "@/lib/database/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-05"
    
    let dateFilter = "";
    const values: any[] = [];
    
    if (month) {
      dateFilter = "AND DATE_FORMAT(o.order_date, '%Y-%m') = ?";
      values.push(month);
    }

    // 1. Sales, Cost, and Profit Summary
    const salesQuery = `
      SELECT 
        SUM(oi.quantity * oi.price_at_purchase) as total_sales,
        SUM(oi.quantity * oi.cost_price_at_purchase) as total_cost,
        SUM(oi.quantity * (oi.price_at_purchase - oi.cost_price_at_purchase)) as total_profit
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      WHERE o.status != 'cancelled' ${dateFilter}
    `;

    // 2. Rating Distribution
    const ratingQuery = `
      SELECT 
        rating, 
        COUNT(*) as count 
      FROM order_items 
      WHERE rating IS NOT NULL
      GROUP BY rating
      ORDER BY rating DESC
    `;

    // 3. Top Selling Products
    const topProductsQuery = `
      SELECT 
        p.product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * (oi.price_at_purchase - oi.cost_price_at_purchase)) as product_profit
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      JOIN orders o ON o.order_id = oi.order_id
      WHERE o.status != 'cancelled' ${dateFilter}
      GROUP BY p.product_id
      ORDER BY total_quantity DESC
      LIMIT 5
    `;

    // 4. Monthly Trend (last 12 months)
    const trendQuery = `
      SELECT 
        DATE_FORMAT(o.order_date, '%Y-%m') as month,
        SUM(oi.quantity * oi.price_at_purchase) as sales,
        SUM(oi.quantity * oi.cost_price_at_purchase) as cost,
        SUM(oi.quantity * (oi.price_at_purchase - oi.cost_price_at_purchase)) as profit
      FROM order_items oi
      JOIN orders o ON o.order_id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;

    // 5. Highest Rated Products
    const highestRatedProductsQuery = `
      SELECT 
        p.product_name,
        AVG(oi.rating) as avg_rating,
        COUNT(oi.rating) as rating_count
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      WHERE oi.rating IS NOT NULL
      GROUP BY p.product_id
      ORDER BY avg_rating DESC, rating_count DESC
      LIMIT 5
    `;

    const [
      [salesData],
      [ratingData],
      [topProducts],
      [trendData],
      [highestRatedData]
    ] = await Promise.all([
      database.query(salesQuery, values),
      database.query(ratingQuery),
      database.query(topProductsQuery, values),
      database.query(trendQuery),
      database.query(highestRatedProductsQuery)
    ]);

    return NextResponse.json({
      summary: (salesData as any)[0],
      ratings: ratingData,
      topProducts: topProducts,
      trends: trendData,
      highestRatedProducts: highestRatedData
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to generate reports", error);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
