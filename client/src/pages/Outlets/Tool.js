import MisaLogo from '../../images/logo-misa.png'
import CalculatorImg from '../../images/calculator.png'
import OpenProject from '../../images/open_project.png'
import OneDrive from '../../images/one-drive.png'
import Search from '../../images/search.png'
import InventoryImg from '../../images/inventory.png'
import CheckList from '../../images/checklist.png'
import { Button, Space } from 'antd'
import { Typography } from 'antd'

const { Title } = Typography

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

  const handleClickToUpdateXNKData = () => {
    window.open(
      'https://docs.google.com/spreadsheets/d/1oWmiFguSUm4xpH1iMPxRYvjV2_0go60-P6wdSVGdF4U/edit?gid=0#gid=0',
      '_blank'
    )
  }

  const handleClickToGetXNKData = () => {
    window.open(
      'https://metabase.seacorp.vn/public/question/de6830c2-f0ea-4a06-aacf-f695ddc5e247',
      '_blank'
    )
  }

  const handleToSearchProduct = () => {
    window.open('/misa-data-transformer', '_blank')
  }

  return (
    <>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={4} style={{ marginTop: 0 }}>
          Công cụ tiện ích
        </Title>
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
            onClick={handleToSearchProduct}
          >
            <span>Tìm kiếm sản phẩm</span>
            <img src={Search} alt="" style={{ width: 17 }} />
          </Button>
          <Space.Compact>
            <Button
              style={{ display: 'flex', alignItems: 'center' }}
              color="default"
              variant="outlined"
              onClick={handleClickToUpdateXNKData}
            >
              <span>Cập nhật danh sách XNK</span>
              <img src={InventoryImg} alt="" style={{ width: 17 }} />
            </Button>
            <Button
              style={{ display: 'flex', alignItems: 'center' }}
              color="default"
              variant="outlined"
              onClick={handleClickToGetXNKData}
            >
              <span>Lấy 3 lần XNK gần nhất</span>
              <img src={CheckList} alt="" style={{ width: 17 }} />
            </Button>
          </Space.Compact>
        </Space>
      </Space>

      <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          Phần mềm
        </Title>
        <Space wrap={true}>
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
      </Space>
    </>
  )
}

export default Tools
