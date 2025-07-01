import MisaLogo from '../../images/logo-misa.png'
import CalculatorImg from '../../images/calculator.png'
import OpenProject from '../../images/open_project.png'
import OneDrive from '../../images/one-drive.png'
import { Button, Space } from 'antd'

const Tools = () => {
  const handleClickToMisaDataTransformer = () => {
    window.open('/misa-data-transformer', '_blank')
  }

  const handleClickToBQCKCalculator = () => {
    window.open('/bqck-calculator', '_blank')
  }

  const handleClickToQLCV = () => {
    window.open('https://project.seacorp.vn/', '_blank')
  }

  const handleClickToSdrive = () => {
    window.open('https://sdrive.seacorp.vn/', '_blank')
  }
  return (
    <Space wrap={true}>
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
      <Button
        style={{ display: 'flex', alignItems: 'center' }}
        color="default"
        variant="outlined"
        onClick={handleClickToSdrive}
      >
        <span>Quản lý tài liệu</span>
        <img src={OneDrive} alt="" style={{ width: 17 }} />
      </Button>
      <Button
        style={{ display: 'flex', alignItems: 'center' }}
        color="default"
        variant="outlined"
        onClick={handleClickToQLCV}
      >
        <span>Quản lý công việc</span>
        <img src={OpenProject} alt="" style={{ width: 27 }} />
      </Button>
    </Space>
  )
}

export default Tools
