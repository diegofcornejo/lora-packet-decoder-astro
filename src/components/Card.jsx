import styles from './Card.module.css';

const Card = ({ title, children }) => {
    return (
        <div className={`${styles.card} w-full lg:w-1/3 overflow-auto mt-4 max-h-96`}>
            <h2>{title}</h2>
            {children}
        </div>
    );
};

export default Card;
