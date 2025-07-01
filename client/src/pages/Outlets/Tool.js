import MisaLogo from '../../images/logo-misa.png'
import CalculatorImg from '../../images/calculator.png'
import { Button, Space } from 'antd'

const Tools = () => {
  const handleClickToMisaDataTransformer = () => {
    window.open('/misa-data-transformer', '_blank')
  }

  const handleClickToBQCKCalculator = () => {
    window.open('/bqck-calculator', '_blank')
  }
  return (
    <Space>
      <Button
        style={{ display: 'flex', alignItems: 'center' }}
        color="default"
        variant="outlined"
        onClick={handleClickToMisaDataTransformer}
      >
        <span>Xuất file import vào MISA</span>
        <img src={MisaLogo} alt="" style={{ width: 20 }} />
      </Button>
      <Button
        style={{ display: 'flex', alignItems: 'center' }}
        color="default"
        variant="outlined"
        onClick={handleClickToBQCKCalculator}
      >
        <span>Tính giá xuất kho BQCK</span>
        <img src={CalculatorImg} alt="" style={{ width: 15 }} />
      </Button>
    </Space>
  )
}

export default Tools
