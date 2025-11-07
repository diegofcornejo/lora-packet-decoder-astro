import { useState } from 'react';
import styles from './Card.module.css';
import { toast } from 'sonner';

const Card = ({ title, children, copyableContent }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (isCopied) return;

        if (!copyableContent || copyableContent.trim() === '') {
            toast.warning('Nothing to copy.');
            return;
        }

        navigator.clipboard.writeText(copyableContent)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch(err => {
                toast.error('Failed to copy content.');
                console.error('Failed to copy: ', err);
            });
    };

    return (
        <div className={`${styles.card} w-full lg:flex-1 overflow-auto mt-4 max-h-96`}>
            {copyableContent && (
                <button onClick={handleCopy} className={styles.copyButton} title="Copy to clipboard">
                    {isCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.checkIcon}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={styles.copyIcon}>
                            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
                            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                        </svg>
                    )}
                </button>
            )}
            <h2>{title}</h2>
            {children}
        </div>
    );
};

export default Card;
