import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {Icon && (
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Icon className="h-8 w-8 text-gray-400" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
