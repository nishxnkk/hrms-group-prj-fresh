import { getDashboardStats, getOverviewStats } from "../models/dashboard.model.js";

export const getStats = async (req, res) => {
    try {
        const { rows } = await getDashboardStats();
        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
};

export const getOverview = async (req, res) => {
    try {
        const data = await getOverviewStats();
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error("Error fetching dashboard overview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard overview",
            error: error.message
        });
    }
};
