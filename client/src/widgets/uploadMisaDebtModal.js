import { useState } from 'react'
import { Button, Upload } from 'antd'
import { useZustand } from '../zustand'
import * as XLSX from 'xlsx'
import { UploadOutlined } from '@ant-design/icons'
import app from '../axiosConfig'
import { Modal } from 'antd'
import { Form } from 'antd'
import { validExcelFile } from '../globalVariables'
import { DatePicker } from 'antd'
import { Select } from 'antd'
import { FaBook } from 'react-icons/fa'

const UploadMisaDebtModal = ({
  isModalUploadMisaOpen,
  handleCancel,
  handleFetchInterCompanyFinances,
}) => {
  const [form] = Form.useForm()
  const { auth, companies, accounts } = useZustand()
  const [fileList, setFileList] = useState([])
  const [loading, setLoading] = useState(false)

  const handleChange = (info) => {
    // Allow only one file
    setFileList(info.fileList.slice(-1))
  }

  const handleOk = async () => {
    try {
      const { subjectCompanyId, date } = form.getFieldsValue()
      if (!subjectCompanyId || !date)
        return alert('Vui lòng cung cấp công ty chủ thể và ngày')
      if (fileList.length === 0)
        return alert('Vui lòng thả file MISA vào, thiếu file rồi!')
      const file = fileList[0].originFileObj
      const fileType = file.type
      if (!validExcelFile.includes(fileType))
        return alert('File của bạn phải là excel')
      if (loading) return
      setLoading(true)
      // // Read file into ArrayBuffer
      const buffer = await new Promise((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.readAsArrayBuffer(file)
        fileReader.onload = (e) => resolve(e.target.result)
        fileReader.onerror = (err) => reject(err)
      })

      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const wsname = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        header: 1,
      })
      data.splice(0, 2)
      const processedData = data.map((i) => {
        let processedData = {
          counterpartCompanyId: i[0]?.toString(),
          subjectCompanyId: subjectCompanyId,
          debit: i[7],
          credit: i[8],
          date: date,
          account: i[2],
        }
        return processedData
      })

      let errorText = ''
      const allValueValid = processedData.every((i, index) => {
        if (!i.counterpartCompanyId) {
          errorText += `Điền mã số thuế công ty đối tác hệ thống tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        if (i.debit === undefined || i.credit === undefined) {
          errorText += `Nợ và Có không được để trống. Vui lòng kiểm tra lại tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        if (i.debit < 0 || i.credit < 0) {
          errorText += `Nợ và có phải là số dương. Vui lòng kiểm tra lại tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        if (!i.date) {
          errorText += `Ngày không được để trống. Vui lòng kiểm tra lại tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        if (!i.account) {
          errorText += `Tài khoản không được để trống. Vui lòng kiểm tra lại tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        if (i.account.toString().length < 3) {
          errorText += `Tài khoản phải ít nhất 3 ký tự tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        const respectiveAccount = accounts.find(
          (it) => it.code.toString() === i.account?.toString().substring(0, 3)
        )

        if (!respectiveAccount) {
          errorText += `3 ký tự đầu của tài khoản ${
            i.account
          } không có trong hệ thống tại dòng thứ ${index + 1}\n`
          return false
        }

        if (
          !['payable', 'receivable', 'investing', 'investing_receivable'].find(
            (e) => e === respectiveAccount.type
          )
        ) {
          errorText += `Loại phải là "Phải trả" hoặc "Phải thu" hoặc "Đã đầu tư" hoặc "Phải thu đầu tư". Vui lòng kiểm tra lại tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        if (
          ['business', 'finance', 'invest', 'others'].find(
            (e) => e === respectiveAccount.activityGroup
          ) === undefined
        ) {
          errorText += `Nhóm hoạt động phải là "Hoạt động kinh doanh", "Hoạt động đầu tư", "Hoạt động tài chính" hoặc "Khác". Vui lòng kiểm tra lại tại dòng thứ ${
            index + 1
          }.\n`
          return false
        }

        return true
      })

      if (!allValueValid) return alert(errorText)

      const myMapList = processedData.map((i) => {
        const {
          subjectCompanyId,
          counterpartCompanyId,
          debit,
          credit,
          date,
          account,
        } = i

        const newCounterpartCompanyId = companies.find(
          (item) => item.taxCode === counterpartCompanyId
        )

        const respectiveAccount = accounts.find(
          (it) => it.code?.toString() === account?.toString()?.substring(0, 3)
        )

        const processedData = {
          subjectCompanyId: subjectCompanyId,
          counterpartCompanyId: newCounterpartCompanyId?._id,
          debit,
          credit,
          type: respectiveAccount?.type,
          activityGroup: respectiveAccount?.activityGroup,
          date,
          accountId: respectiveAccount?._id,
        }
        return app.post('/api/create-inter-company-finance', processedData)
      })

      await Promise.all(myMapList)
      handleClose()
    } catch (error) {
      alert(`Lỗi không xác định:  ${error?.response?.data?.msg || error}`)
    } finally {
      setLoading(false)
      await handleFetchInterCompanyFinances()
      handleClose()
    }
  }

  const handleClose = () => {
    form.resetFields()
    handleCancel()
  }

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title="Upload số dư công nợ bằng file MISA"
      open={isModalUploadMisaOpen}
      onOk={handleOk}
      onCancel={handleClose}
    >
      <Button
        color="primary"
        variant="filled"
        onClick={() => {
          window.open(
            'https://sdrive.seacorp.vn/f/ca4abb19af4f46c189aa/',
            '_blank'
          )
        }}
        style={{ marginBottom: 16 }}
        icon={<FaBook />}
      >
        Đọc hướng dẫn
      </Button>
      <Form
        form={form}
        name="dynamic_ruleEdit"
        onFinish={handleOk}
        disabled={loading}
        layout="vertical"
      >
        <Form.Item
          name="date"
          label="Ngày"
          style={{ flex: 1 }}
          rules={[{ required: true, message: 'Nhập ngày!' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="subjectCompanyId"
          label="Công ty chủ thể"
          rules={[
            { required: true, message: 'Vui lòng chọn công ty chủ thể!' },
          ]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={companies
              .filter((i) => auth.companyIds.includes(i._id))
              .map((i) => {
                return { value: i._id, label: i.name }
              })}
          />
        </Form.Item>
        <Upload
          beforeUpload={() => false}
          onChange={handleChange}
          fileList={fileList}
          multiple={false}
          maxCount={1} // Optional, makes sure only one can be selected
        >
          <Button disabled={loading} icon={<UploadOutlined />}>
            Thả file MISA vào
          </Button>
        </Upload>
      </Form>
    </Modal>
  )
}

export default UploadMisaDebtModal
