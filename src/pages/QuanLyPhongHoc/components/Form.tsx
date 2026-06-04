import { DANH_SACH_NGUOI_PHU_TRACH, LOAI_PHONG_LABEL } from '@/models/phongHoc';
import { BankOutlined, FieldNumberOutlined, TagOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, InputNumber, Row, Select, Space, Tag } from 'antd';
import { useEffect } from 'react';
import { useModel } from 'umi';

const { Option } = Select;

const LOAI_PHONG_COLOR: Record<PhongHoc.ELoaiPhong, string> = {
  LY_THUYET: 'blue',
  THUC_HANH: 'green',
  HOI_TRUONG: 'purple',
};

const FormPhongHoc = (props: any) => {
  const [form] = Form.useForm();
  const { record, setVisibleForm, edit, postModel, putModel, formSubmiting, visibleForm } =
    useModel('phongHoc');
  const title = props?.title ?? 'Phòng học';

  useEffect(() => {
    if (!visibleForm) {
      form.resetFields();
    } else if (record?._id) {
      form.setFieldsValue(record);
    }
  }, [record?._id, visibleForm]);

  const onFinish = async (values: PhongHoc.IRecord) => {
    if (edit) {
      putModel(record?._id ?? '', values).catch(() => {});
    } else {
      postModel(values)
        .then(() => form.resetFields())
        .catch(() => {});
    }
  };

  const headerColor = edit ? '#1677ff' : '#52c41a';
  const headerBg = edit ? '#e6f4ff' : '#f6ffed';
  const headerBorder = edit ? '#91caff' : '#b7eb8f';

  return (
    <div style={{ padding: '0' }}>
      <div
        style={{
          padding: '16px 24px 14px',
          borderBottom: `1px solid ${headerBorder}`,
          background: headerBg,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <BankOutlined style={{ fontSize: 18, color: headerColor }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: headerColor }}>
          {edit ? 'Chỉnh sửa ' : 'Thêm mới '}{title?.toLowerCase()}
        </span>
      </div>

      <Form
        onFinish={onFinish}
        form={form}
        layout="vertical"
        style={{ padding: '20px 24px 8px' }}
        requiredMark={false}
      >
        <Form.Item
          name="ma"
          label={
            <Space size={4}>
              <TagOutlined style={{ color: '#8c8c8c' }} />
              <span>Mã phòng</span>
            </Space>
          }
          rules={[
            { required: true, message: 'Vui lòng nhập mã phòng' },
            { max: 10, message: 'Tối đa 10 ký tự' },
            { whitespace: true, message: 'Không được để trắng' },
          ]}
        >
          <Input placeholder="VD: P101" maxLength={10} showCount />
        </Form.Item>

        <Form.Item
          name="ten"
          label={
            <Space size={4}>
              <BankOutlined style={{ color: '#8c8c8c' }} />
              <span>Tên phòng</span>
            </Space>
          }
          rules={[
            { required: true, message: 'Vui lòng nhập tên phòng' },
            { max: 50, message: 'Tối đa 50 ký tự' },
            { whitespace: true, message: 'Không được để trắng' },
          ]}
        >
          <Input
            placeholder="VD: Phòng học lý thuyết 101"
            maxLength={50}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="loaiPhong"
          label={
            <Space size={4}>
              <TagOutlined style={{ color: '#8c8c8c' }} />
              <span>Loại phòng</span>
            </Space>
          }
          rules={[{ required: true, message: 'Vui lòng chọn loại phòng' }]}
        >
          <Select placeholder="Chọn loại phòng" allowClear>
            {(Object.keys(LOAI_PHONG_LABEL) as PhongHoc.ELoaiPhong[]).map((key) => (
              <Option key={key} value={key}>
                <Tag color={LOAI_PHONG_COLOR[key]} style={{ marginRight: 6 }}>
                  {LOAI_PHONG_LABEL[key]}
                </Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="soChoNgoi"
          label={
            <Space size={4}>
              <FieldNumberOutlined style={{ color: '#8c8c8c' }} />
              <span>Số chỗ ngồi</span>
            </Space>
          }
          rules={[
            { required: true, message: 'Vui lòng nhập số chỗ ngồi' },
            { type: 'number', min: 10, message: 'Tối thiểu 10 chỗ' },
            { type: 'number', max: 200, message: 'Tối đa 200 chỗ' },
          ]}
        >
          <InputNumber placeholder="10 – 200" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="nguoiPhuTrach"
          label={
            <Space size={4}>
              <UserOutlined style={{ color: '#8c8c8c' }} />
              <span>Người phụ trách</span>
            </Space>
          }
          rules={[{ required: true, message: 'Vui lòng chọn người phụ trách' }]}
        >
          <Select
            placeholder="Chọn người phụ trách"
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {DANH_SACH_NGUOI_PHU_TRACH.map((name) => (
              <Option key={name} value={name}>
                <Space size={6}>
                  <TeamOutlined style={{ color: '#8c8c8c' }} />
                  {name}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider style={{ margin: '8px 0 16px' }} />

        <Row justify="end">
          <Space>
            <Button onClick={() => setVisibleForm(false)}>Hủy</Button>
            <Button loading={formSubmiting} htmlType="submit" type="primary">
              {!edit ? 'Thêm mới' : 'Lưu lại'}
            </Button>
          </Space>
        </Row>
      </Form>
    </div>
  );
};

export default FormPhongHoc;
