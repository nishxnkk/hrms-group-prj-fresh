import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById, findUserByUsername, updateUser } from "../models/user.model.js";

export const createUserService = async (
    fullname,
    username,
    email,
    password,
    designation = '',
    job_title = '',
    department = '',
    phone = '',
    date_of_joining = null,
    employee_id = '',
    profile_picture = '',
    status = 'ACTIVE',
    role = 'Employee',
    gender = 'Not Specified'
) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error("User already exists");
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
        throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(
        fullname,
        username,
        email,
        hashedPassword,
        designation,
        job_title,
        department,
        phone,
        date_of_joining,
        employee_id,
        profile_picture,
        status,
        role,
        gender
    );

    return newUser;
};

export const updateUserService = async (id, updates) => {
    const user = await findUserById(id);
    if (!user) {
        throw new Error("User not found");
    }

    if (updates.email && updates.email !== user.email) {
        const existing = await findUserByEmail(updates.email);
        if (existing && existing.id !== user.id) {
            throw new Error("Email already in use");
        }
    }

    if (updates.username && updates.username !== user.username) {
        const existing = await findUserByUsername(updates.username);
        if (existing && existing.id !== user.id) {
            throw new Error("Username already in use");
        }
    }

    if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updated = await updateUser(id, updates);
    return updated;
};
