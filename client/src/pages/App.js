import { useState, useEffect } from 'react'
import { Layout, Menu, theme, Button, Space } from 'antd'
import { Avatar } from 'antd'
import { useZustand } from '../zustand'
import { FaRegBuilding } from 'react-icons/fa'
import { Dropdown } from 'antd'
import { PoweroffOutlined, LockOutlined } from '@ant-design/icons'
import { FaCaretDown } from 'react-icons/fa'
import { FaHandshakeSimple } from 'react-icons/fa6'
import app from '../axiosConfig'
import ChangePasswordModal from '../widgets/changePasswordModal'
import { GrTransaction } from 'react-icons/gr'
import { Outlet, useNavigate } from 'react-router'
import Loading from '../widgets/loading'
import { FaRegUser } from 'react-icons/fa6'
import { BsBank2 } from 'react-icons/bs'
import { RiBankCardFill } from 'react-icons/ri'
import { IoDocument } from 'react-icons/io5'
import { BsPiggyBankFill } from 'react-icons/bs'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { FaMoneyBill1Wave } from 'react-icons/fa6'
import { IoSettings } from 'react-icons/io5'
import useCheckRights from '../utils/checkRights'
import { FaTools } from 'react-icons/fa'
const { Header, Content, Sider } = Layout

const siderStyle = {
  overflow: 'auto',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
}

const App = () => {
  const { auth, logout } = useZustand()
  const {
    setUserState,
    setCompanyState,
    setBankState,
    setBankAccountState,
    setIndentureState,
    setPaymentPlanState,
    setSourceState,
    setObjectsState,
    setRightsState,
    setAccessGroupState,
    setLoanContractState,
    setInterCompanyFinanceState,
    setCompanyTypeState,
  } = useZustand()
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [sidebarIndex, setSidebarIndex] = useState('1')
  const [collapsed, setCollapsed] = useState(true)
  const navigate = useNavigate()
  const checkRights = useCheckRights()

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleLogout = async (needConfirm = true) => {
    if (needConfirm && !window.confirm('Bạn có muốn đăng xuất?')) return
    await app.delete('/api/log-out')
    logout()
  }

  const handleNavigate = (name, value) => {
    setSidebarIndex(value.toString())
    navigate(name)
  }

  const navbarItems = [
    {
      key: 1,
      icon: <FaRegUser />,
      label: 'Người dùng',
      disabled: !checkRights('user', ['read']),
      onClick: () => {
        handleNavigate('/user', 1)
      },
    },
    {
      key: 2,
      icon: <FaRegBuilding />,
      label: 'Công ty',
      disabled: !checkRights('company', ['read']),
      onClick: () => {
        handleNavigate('/company', 2)
      },
    },
    {
      key: 3,
      icon: <BsBank2 />,
      label: 'Ngân hàng',
      disabled: !checkRights('bank', ['read']),
      onClick: () => {
        handleNavigate('/bank', 3)
      },
    },
    {
      key: 4,
      icon: <RiBankCardFill />,
      label: 'Số tài khoản',
      disabled: !checkRights('bankAccount', ['read']),
      onClick: () => {
        handleNavigate('/bank-account', 4)
      },
    },
    {
      key: 4.5,
      icon: <FaHandshakeSimple />,
      label: 'Hợp đồng vay',
      disabled: !checkRights('loanContract', ['read']),
      onClick: () => {
        handleNavigate('/loan-contract', 4.5)
      },
    },
    {
      key: 5,
      icon: <IoDocument />,
      label: 'Khế ước ngân hàng',
      disabled: !checkRights('indenture', ['read']),
      onClick: () => {
        handleNavigate('/indenture', 5)
      },
    },
    {
      key: 6,
      icon: <BsPiggyBankFill />,
      label: 'Kế hoạch thanh toán',
      disabled: !checkRights('paymentPlan', ['read']),
      onClick: () => {
        handleNavigate('/payment-plan', 6)
      },
    },
    {
      key: 7,
      icon: <FaMoneyBill1Wave />,
      label: 'Nguồn',
      disabled: !checkRights('source', ['read']),
      onClick: () => {
        handleNavigate('/source', 7)
      },
    },
    {
      key: 7.2,
      icon: <GrTransaction />,
      label: 'Hệ thống công nợ',
      disabled: !checkRights('interCompanyFinance', ['read']),
      onClick: () => {
        handleNavigate('/inter-company-finance', 7.2)
      },
    },
    {
      key: 7.5,
      icon: <FaTools />,
      label: 'Tiện ích',
      onClick: () => {
        handleNavigate('/tool', 7.5)
      },
    },
    {
      key: 8,
      icon: <IoSettings />,
      label: 'Cài đặt quyền',
      disabled: !checkRights('accessGroup', ['read']),
      onClick: () => {
        handleNavigate('/setting', 8)
      },
    },
  ]

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handleChangePassword = async (oldPass, newPass) => {
    try {
      if (loading) return
      setLoading(true)
      await app.patch('/api/change-password', { oldPass, newPass })
      alert('Đã đổi mật khẩu thành công! Vui lòng đăng nhập lại')
      await handleLogout(false)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchData = async () => {
    try {
      setIsFetching(true)
      const result = await Promise.all([
        app.get(`/api/get-users`),
        app.get('/api/get-companies'),
        app.get('/api/get-banks'),
        app.get('/api/get-bank-accounts'),
        app.get('/api/get-indentures'),
        app.get('/api/get-payment-plans'),
        app.get('/api/get-sources'),
        app.get('/api/get-objects'),
        app.get('/api/get-rights'),
        app.get('/api/get-access-groups'),
        app.get('/api/get-loan-contracts'),
        app.get('/api/get-inter-company-finances'),
        app.get('/api/get-company-types'),
      ])

      setUserState(result[0]?.data?.data)
      setCompanyState(result[1]?.data?.data)
      setBankState(result[2]?.data?.data)
      setBankAccountState(result[3]?.data?.data)
      setIndentureState(result[4]?.data?.data)
      setPaymentPlanState(result[5]?.data?.data)
      setSourceState(result[6]?.data?.data)
      setObjectsState(result[7]?.data?.data)
      setRightsState(result[8]?.data?.data)
      setAccessGroupState(result[9]?.data?.data)
      setLoanContractState(result[10]?.data?.data)
      setInterCompanyFinanceState(result[11]?.data?.data)
      setCompanyTypeState(result[12]?.data?.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setIsFetching(false)
    }
  }

  const items = [
    {
      label: 'Đổi mật khẩu',
      key: '0',
      icon: <LockOutlined />,
      onClick: showModal,
    },
    {
      type: 'divider',
    },
    {
      label: 'Đăng xuất',
      key: '1',
      danger: true,
      icon: <PoweroffOutlined />,
      onClick: handleLogout,
    },
  ]

  useEffect(() => {
    handleFetchData()
  }, [])

  if (isFetching) return <Loading />

  return (
    <Layout hasSider>
      <Sider
        style={siderStyle}
        width={220}
        collapsible
        trigger={null}
        collapsed={!collapsed}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[sidebarIndex]}
          items={navbarItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem 0 0',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </Space>
          {isModalOpen && (
            <ChangePasswordModal
              handleCancel={handleCancel}
              isModalOpen={isModalOpen}
              handleChangePassword={handleChangePassword}
              loading={loading}
            />
          )}
          <Dropdown
            menu={{
              items,
            }}
            trigger={['click']}
          >
            <span onClick={(e) => e.preventDefault()}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <Avatar style={{ backgroundColor: '#f56a00' }}>
                  {auth?.name.slice(0, 1).toUpperCase()}
                </Avatar>
                <span className="text-xm mr-1">{auth.name}</span>
                <FaCaretDown />
              </div>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px 24px', overflow: 'initial' }}>
          <div
            style={{
              padding: 24,
              boxShadow: '1px 1px 1px rgba(0,0,0,0.1)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
export default App
