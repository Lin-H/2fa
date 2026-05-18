import { FC } from 'react';
import styles from './index.module.scss';
import alipay from '@/assets/alipay.svg';

const Code: FC = () => {
  const getProgress = (p: number) => {
    return (2 * Math.PI * 21 * p) / 100;
  };

  return (
    <div className={styles.code}>
      <div>
        <div className={styles.provider}>
          <img src={alipay} alt="" className={styles.icon} />
          <div>
            <h3>AliPay 支付宝</h3>
            <div className={styles.email}>asdasd@asd.com</div>
          </div>
        </div>
        <div className={styles.key}>1234567890</div>
      </div>
      <svg className={styles.counter}>
        <circle r="21" cx="24" cy="24" className={styles.outer}></circle>
        <circle
          r="21"
          cx="24"
          cy="24"
          strokeDasharray={`${getProgress(25)} 999`}
          className={styles.inner}
        ></circle>
      </svg>
    </div>
  );
};

export default Code;
