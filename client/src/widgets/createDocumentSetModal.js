import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import { Form, Input } from 'antd'
import app from '../axiosConfig'
import { Select, Space, Tooltip } from 'antd'
import { useZustand } from '../zustand'
import { UploadOutlined } from '@ant-design/icons'
import { Button, Upload, Table } from 'antd'
import moment from 'moment'
import { MdDelete } from 'react-icons/md'
import { FaDownload } from 'react-icons/fa'
import useCheckRights from '../utils/checkRights'
import enImg from '../images/en.png'
import { FaLock } from 'react-icons/fa'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

const DocumentSetCreateModal = ({
  isModalOpen,
  handleCancel,
  handleFetchDocumentSets,
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])
  const { companies, auth } = useZustand()
  const [documents, setDocuments] = useState([])
  const checkRights = useCheckRights()
  const [isFetching, setIsFetching] = useState(false)

  const handleOk = async () => {
    try {
      if (loading) return
      const { name, company_id, description } = form.getFieldsValue()
      if (!name?.trim()) return alert('Vui lòng nhập đầy đủ thông tin')

      setLoading(true)

      let setId = isModalOpen?._id || null
      if (isModalOpen?._id) {
        await app.patch(`/api/update-document-set/${isModalOpen?._id}`, {
          name,
          company_id,
          description,
        })
      } else {
        const { data } = await app.post('/api/create-document-set', {
          name,
          company_id,
          description,
        })
        setId = data.data._id
      }

      const newFileList = fileList.map((i) => {
        return app.post('/api/create-document', {
          set_id: setId,
          invoice_date: i.invoice_date,
          invoice_number: i.invoice_number,
          tax_code: i.tax_code,
          file: i.buffer,
          type: i.type,
          name: i.name,
        })
      })
      await Promise.all(newFileList)

      await handleFetchDocumentSets()
      handleCancel()
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleLockDocumentSet = async () => {
    try {
      if (loading) return
      if (
        !window.confirm(
          'Bạn có chắc muốn khóa bộ tài liệu này? Một khi bộ tài liệu được khóa, bạn không thể mở khóa bộ tài liệu này được nữa'
        )
      )
        return
      setLoading(true)
      await app.patch(`/api/update-document-set/${isModalOpen?._id}`, {
        is_locked: true,
      })
      await handleFetchDocumentSets()
      handleCancel()
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchDocuments = async () => {
    try {
      if (isFetching) return
      setIsFetching(true)
      const { data } = await app.get(`/api/get-documents/${isModalOpen?._id}`)
      setDocuments(data.data)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleClose = () => {
    form.resetFields()
    handleCancel()
  }

  const props = {
    onRemove: (file) => {
      const index = fileList.indexOf(file)
      const newFileList = fileList.slice()
      newFileList.splice(index, 1)
      setFileList(newFileList)
    },
    beforeUpload: async (file) => {
      const isLt2M = file.size / 1024 / 1024 < 2 // check size in MB
      if (!isLt2M) {
        alert('Dung lượng file phải nhỏ hơn 2MB!')
        return Upload.LIST_IGNORE // prevents file from being added to list
      } else {
        const listItem = file.name.split('.')
        const invoiceDateString = listItem[0]
        const invoiceNumber = listItem[1]
        const taxCode = listItem[2]

        if (!invoiceDateString || !invoiceNumber || !taxCode) {
          alert('Tên file không hợp lệ!')
          return Upload.LIST_IGNORE
        }

        const day = invoiceDateString.substring(0, 2)
        const month = invoiceDateString.substring(2, 4)
        const year = invoiceDateString.substring(4, 8)

        // JS Date: new Date(year, monthIndex, day)
        // Lưu ý: monthIndex = 0 (Jan) -> 11 (Dec)
        const date = new Date(year, month - 1, day)
        file.invoice_date = date
        file.invoice_number = invoiceNumber
        file.tax_code = taxCode
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Array.from(new Uint8Array(arrayBuffer))
        file.buffer = buffer
        setFileList([...fileList, file])
        return false
      }
    },
    fileList,
  }

  const handleDeleteRecord = async (record) => {
    try {
      if (loading) return
      if (!window.confirm('Bạn có chắc muốn xóa file này?')) return
      setLoading(true)
      await app.delete(`/api/delete-document/${record._id}`)
      const newSources = [...documents].filter((i) => i._id !== record._id)
      setDocuments(newSources)
    } catch (error) {
      alert(error?.response?.data?.msg || error)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (buffer, fileName, mimeType) => {
    // Convert Buffer to Blob
    const byteArray = new Uint8Array(buffer)
    const blob = new Blob([byteArray], { type: mimeType })

    // Create a URL for the Blob
    const url = window.URL.createObjectURL(blob)

    // Create a temporary <a> tag to trigger download
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()

    // Cleanup
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadZip = async () => {
    const zip = new JSZip()

    documents.forEach((file) => {
      // Nếu file.buffer là ArrayBuffer
      const uint8 =
        file.file.data instanceof ArrayBuffer
          ? new Uint8Array(file.file.data)
          : file.file.data

      // Thêm thẳng vào zip
      zip.file(file.name, uint8)
    })

    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${isModalOpen?.name || 'documents'}.zip`)
  }

  useEffect(() => {
    if (isModalOpen?._id) {
      form.setFieldValue('name', isModalOpen?.name)
      form.setFieldValue('description', isModalOpen?.description)
      form.setFieldValue('company_id', isModalOpen?.company_id?._id)
    }
  }, [])

  useEffect(() => {
    if (isModalOpen?._id) {
      handleFetchDocuments()
    }
  }, [])

  const columns = [
    {
      title: 'Tên file',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Ngày hóa đơn',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      render: (text) => moment(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Số hóa đơn',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
    },
    {
      title: 'Mã số thuế',
      dataIndex: 'tax_code',
      key: 'tax_code',
    },
    {
      title: 'Hành động',
      align: 'center',
      key: 'action',
      width: 100,
      hidden: !checkRights('document', ['read']),
      render: (_) => (
        <Space size="small">
          <Tooltip title="Tải file">
            <Button
              size="small"
              variant="filled"
              icon={<FaDownload />}
              onClick={() => downloadFile(_.file.data, _.name, _.type)}
            ></Button>
          </Tooltip>
          {!isModalOpen?.is_locked &&
            checkRights('document', ['canDelete']) &&
            isModalOpen?.created_by &&
            isModalOpen?.created_by?._id == auth._id && (
              <Tooltip title="Xóa">
                <Button
                  color="danger"
                  size="small"
                  variant="filled"
                  icon={<MdDelete />}
                  onClick={() => handleDeleteRecord(_)}
                ></Button>
              </Tooltip>
            )}
        </Space>
      ),
    },
  ]

  return (
    <Modal
      okText="Xác nhận"
      cancelText="Hủy"
      confirmLoading={loading}
      title={isModalOpen?._id ? 'Cập nhật bộ tài liệu' : 'Tạo bộ tài liệu mới'}
      open={isModalOpen}
      onOk={handleOk}
      width={700}
      onCancel={handleClose}
    >
      <Form
        form={form}
        name="dynamic_ruleEdit"
        onFinish={handleOk}
        disabled={
          !checkRights('document', ['write']) ||
          (isModalOpen?.created_by &&
            isModalOpen?.created_by?._id !== auth._id) ||
          isModalOpen?.is_locked
        }
        layout="vertical"
      >
        <Space.Compact style={{ display: 'flex', width: '100%' }}>
          <Form.Item
            name="name"
            style={{ flex: 2 }}
            label="Tên bộ tài liệu"
            rules={[{ required: true, message: 'Hãy nhập tên bộ tài liệu!' }]}
          >
            <Input className="w-full" placeholder="Bộ tài liệu ABC gì đó..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" style={{ flex: 3 }}>
            <Input className="w-full" placeholder="Bộ tài liệu ABC gì đó..." />
          </Form.Item>
        </Space.Compact>
        <Form.Item
          name="company_id"
          label="Công ty"
          rules={[
            { required: true, message: 'Bộ tài liệu này thuộc công ty nào!' },
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
      </Form>
      {checkRights('document', ['create']) &&
        ((isModalOpen?.created_by &&
          isModalOpen?.created_by?._id === auth._id) ||
          !isModalOpen?.created_by) &&
        !isModalOpen?.is_locked && (
          <div
            style={{
              margin: '16px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <Upload {...props} multiple>
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
            <Space>
              {documents.length > 0 && (
                <Button
                  icon={<FaDownload />}
                  color="primary"
                  variant="solid"
                  onClick={handleDownloadZip}
                >
                  Tải bộ tài liệu
                </Button>
              )}
              {isModalOpen?._id && !isModalOpen?.is_locked && (
                <Button
                  color="danger"
                  variant="solid"
                  icon={<FaLock />}
                  onClick={handleLockDocumentSet}
                >
                  Khóa bộ tài liệu
                </Button>
              )}
            </Space>
          </div>
        )}
      {isModalOpen?._id && isModalOpen?.is_locked && (
        <div
          style={{
            margin: '16px 0',
            textAlign: 'right',
          }}
        >
          <Button
            color="primary"
            variant="solid"
            icon={<FaDownload />}
            onClick={handleDownloadZip}
          >
            Tải bộ tài liệu
          </Button>
        </div>
      )}
      {isFetching ? (
        <div
          className="loading"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <img alt="" src={enImg} style={{ width: 100 }} />
          <b style={{ fontWeight: 600 }}>Đang tải dữ liệu...</b>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={documents.map((i) => {
            return { ...i, key: i._id }
          })}
          bordered
          size="small"
          rowKey={(record) => record._id}
          pagination={{
            pageSize: 5,
            simple: true,
            size: 'small',
            position: ['bottomRight'],
            showTotal: (total, range) => (
              <span>
                {range[0]}-{range[1]} / {total}
              </span>
            ),
          }}
        />
      )}
    </Modal>
  )
}

export default DocumentSetCreateModal
