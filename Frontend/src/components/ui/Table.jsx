import React from 'react';

export const Table = ({ children, className = '' }) => {
    return (
        <div className={`w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm ${className}`}>
            <table className="w-full text-sm text-left">{children}</table>
        </div>
    );
};

export const TableHeader = ({ children }) => {
    return <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">{children}</thead>;
};

export const TableRow = ({ children, className = '' }) => {
    return <tr className={`border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors ${className}`}>{children}</tr>;
};

export const TableHead = ({ children, className = '' }) => {
    return <th className={`p-4 font-semibold text-gray-700 ${className}`}>{children}</th>;
};

export const TableCell = ({ children, className = '' }) => {
    return <td className={`p-4 text-gray-600 align-middle ${className}`}>{children}</td>;
};
