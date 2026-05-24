import * as EmployeeOfMonthModel from "../models/employeeOfMonth.model.js"; // EOM Model

// Create new employee of the month with team members
export const createEmployeeOfMonth = async (req, res) => {
    try {
        // Only admins may create Employee of the Month
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }

        const { userId, description, month, teamMembers } = req.body;

        // Validate required fields
        if (!userId || !description || !month) {
            return res.status(400).json({
                success: false,
                message: "User ID, description, and month are required",
            });
        }

        // Create employee of the month entry
        const employeeOfMonth = await EmployeeOfMonthModel.createEmployeeOfMonth(
            userId,
            description,
            month
        );

        // Add team members if provided
        if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
            for (const member of teamMembers) {
                if (member.userId && member.role) {
                    await EmployeeOfMonthModel.addTeamMember(
                        employeeOfMonth.id,
                        member.userId,
                        member.role
                    );
                }
            }
        }

        res.status(201).json({
            success: true,
            message: "Employee of the month created successfully",
            data: employeeOfMonth,
        });
    } catch (error) {
        console.error("Error creating employee of the month:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create employee of the month",
            error: error.message,
        });
    }
};

// Get current employee of the month with team
export const getCurrentEmployeeOfMonth = async (req, res) => {
    try {
        const employeeOfMonth = await EmployeeOfMonthModel.getCurrentEmployeeOfMonth();

        if (!employeeOfMonth) {
            return res.status(404).json({
                success: false,
                message: "No current employee of the month found",
            });
        }

        // Get team members
        const teamMembers = await EmployeeOfMonthModel.getTeamMembers(employeeOfMonth.id);

        res.status(200).json({
            success: true,
            data: {
                ...employeeOfMonth,
                team: teamMembers,
            },
        });
    } catch (error) {
        console.error("Error fetching current employee of the month:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch employee of the month",
            error: error.message,
        });
    }
};

// Add team member to employee of the month
export const addTeamMember = async (req, res) => {
    try {
        // Only admins may add team members
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }

        const { id } = req.params;
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({
                success: false,
                message: "User ID and role are required",
            });
        }

        const teamMember = await EmployeeOfMonthModel.addTeamMember(id, userId, role);

        res.status(201).json({
            success: true,
            message: "Team member added successfully",
            data: teamMember,
        });
    } catch (error) {
        console.error("Error adding team member:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add team member",
            error: error.message,
        });
    }
};

// Delete team member
export const deleteTeamMember = async (req, res) => {
    try {
        // Only admins may delete team members
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }

        const { teamMemberId } = req.params;

        const deletedMember = await EmployeeOfMonthModel.deleteTeamMember(teamMemberId);

        if (!deletedMember) {
            return res.status(404).json({
                success: false,
                message: "Team member not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Team member deleted successfully",
            data: deletedMember,
        });
    } catch (error) {
        console.error("Error deleting team member:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete team member",
            error: error.message,
        });
    }
};

// Delete employee of the month
export const deleteEmployeeOfMonth = async (req, res) => {
    try {
        // Only admins may delete the Employee of the Month entry
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }

        const { id } = req.params;

        const deletedEmployee = await EmployeeOfMonthModel.deleteEmployeeOfMonth(id);

        if (!deletedEmployee) {
            return res.status(404).json({
                success: false,
                message: "Employee of the month not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Employee of the month and team deleted successfully",
            data: deletedEmployee,
        });
    } catch (error) {
        console.error("Error deleting employee of the month:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete employee of the month",
            error: error.message,
        });
    }
};
