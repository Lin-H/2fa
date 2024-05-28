import { FC } from 'react';
import styles from './index.module.scss';
import alipay from '@/assets/alipay.svg';

type Props = {};

const Code: FC = (props: Props) => {
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
      <div className={styles.counter}>
        <div></div>
      </div>
    </div>
  );
};

export default Code;
