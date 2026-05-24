import React from 'react';

const Card = ({ children, className = '', padding = 'p-6' }) => {
    return (
        <div className={`bg-white dark:bg-[#2C50AB] rounded-xl border border-gray-200 dark:border-[#88AAFF] shadow-sm ${padding} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
