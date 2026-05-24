import React, { useState } from 'react';
import ProfilePage from '../../components/Profile/ProfilePage';
import EditProfilePage from '../../components/Profile/EditProfilePage';

const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);

    const handleEditProfile = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveProfile = (updatedUser) => {
        if (updatedUser) {
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        setIsEditing(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 dark:text-gray-100 min-h-screen">
            {isEditing ? (
                <EditProfilePage onCancel={handleCancelEdit} onSave={handleSaveProfile} />
            ) : (
                <ProfilePage onEditProfile={handleEditProfile} />
            )}
        </div>
    );
};

export default Profile;
