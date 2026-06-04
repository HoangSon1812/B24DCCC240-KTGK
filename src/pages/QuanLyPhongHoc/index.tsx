import { EOperatorType } from '@/components/Table/constant';
import type { TFilter } from '@/components/Table/typing';
import { DANH_SACH_NGUOI_PHU_TRACH, LOAI_PHONG_LABEL } from '@/models/phongHoc';
import {
  AppstoreOutlined,
  BankOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  LaptopOutlined,
  LockOutlined,
  PlusCircleOutlined,
  SortAscendingOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  Pagination,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import Highlighter from 'react-highlight-words';
import { useEffect, useState } from 'react';
import { useModel } from 'umi';
import FormPhongHoc from './components/Form';
import './index.less';

const LOAI_PHONG_COLOR: Record<PhongHoc.ELoaiPhong, string> = {
  LY_THUYET: 'blue',
  THUC_HANH: 'green',
  HOI_TRUONG: 'purple',
};

const LOAI_PHONG_HEX: Record<PhongHoc.ELoaiPhong, string> = {
  LY_THUYET: '#1677ff',
  THUC_HANH: '#52c41a',
  HOI_TRUONG: '#722ed1',
};

const STAT_CARDS = [
  { key: 'total' as const, label: 'Tổng phòng học', icon: <BankOutlined />, color: '#1677ff' },
  { key: 'LY_THUYET' as const, label: 'Lý thuyết', icon: <TeamOutlined />, color: '#4096ff' },
  { key: 'THUC_HANH' as const, label: 'Thực hành', icon: <LaptopOutlined />, color: '#52c41a' },
  { key: 'HOI_TRUONG' as const, label: 'Hội trường', icon: <BankOutlined />, color: '#722ed1' },
];

const getSeatColor = (val: number) => {
  if (val < 50) return '#52c41a';
  if (val < 100) return '#1677ff';
  return '#fa8c16';
};

const SeatProgress = ({ val }: { val: number }) => {
  const percent = Math.round(((val - 10) / (200 - 10)) * 100);
  return (
    <Tooltip title={`${val} / 200 chỗ ngồi (${percent}%)`}>
      <div style={{ padding: '0 4px', cursor: 'default' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: getSeatColor(val) }}>{val}</span>
          <span style={{ fontSize: 11, color: '#aaa' }}>/ 200</span>
        </div>
        <Progress percent={percent} showInfo={false} size="small" strokeColor={getSeatColor(val)} />
      </div>
    </Tooltip>
  );
};

const DeleteAction = ({
  record,
  onDelete,
  compact,
}: {
  record: PhongHoc.IRecord;
  onDelete: () => void;
  compact?: boolean;
}) => {
  if (record.soChoNgoi < 30) {
    return (
      <Tooltip title="Xóa phòng này">
        <Popconfirm
          onConfirm={onDelete}
          title={<span>Xóa phòng <b>{record.ten}</b>?</span>}
          placement="topLeft"
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button danger type={compact ? 'text' : 'link'} size={compact ? 'small' : 'middle'} icon={<DeleteOutlined />} />
        </Popconfirm>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={`Phòng có ${record.soChoNgoi} chỗ ≥ 30, không được phép xóa`}>
      <Tag icon={<LockOutlined />} color="default" style={{ cursor: 'not-allowed', fontSize: 11 }}>
        Không xóa được
      </Tag>
    </Tooltip>
  );
};

const QuanLyPhongHocPage = () => {
  const {
    danhSach, page, setPage, limit, setLimit, total, loading,
    filters, setFilters, sort, setSort, getModel,
    globalSearch, setGlobalSearch,
    statsByType, visibleForm, setVisibleForm, setEdit, setRecord, setIsView,
    handleEdit, deleteModel,
  } = useModel('phongHoc');

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  useEffect(() => {
    getModel();
  }, [page, limit, JSON.stringify(filters), JSON.stringify(sort), globalSearch]);

  const updateFilters = (field: keyof PhongHoc.IRecord, values: string[]) => {
    const updated: TFilter<PhongHoc.IRecord>[] = (filters || []).filter((f) => f.field !== field);
    if (values.length) {
      updated.push({ field, operator: EOperatorType.INCLUDE, values, active: true });
    }
    setFilters(updated);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setGlobalSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters([]);
    setGlobalSearch('');
    setPage(1);
  };

  const handleSortChange = (value: string | undefined) => {
    if (!value) { setSort(undefined); return; }
    const [field, dir] = value.split(':');
    setSort({ [field]: Number(dir) as 1 | -1 });
  };

  const getFilterValues = (field: keyof PhongHoc.IRecord): string[] =>
    ((filters || []).find((f) => f.field === field)?.values ?? []) as string[];

  const currentSort = sort ? Object.entries(sort).map(([f, d]) => `${f}:${d}`)[0] : undefined;

  const hasActiveFilters =
    (filters || []).some((f) => f.active !== false && f.values?.length > 0) || !!globalSearch;

  const openCreateForm = () => {
    setRecord({} as PhongHoc.IRecord);
    setEdit(false);
    setIsView(false);
    setVisibleForm(true);
  };

  const highlight = (text: string) =>
    globalSearch ? (
      <Highlighter
        highlightStyle={{ backgroundColor: '#ffe58f', padding: 0, borderRadius: 2 }}
        searchWords={[globalSearch]}
        autoEscape
        textToHighlight={text || ''}
      />
    ) : (
      <>{text}</>
    );

  const columns: ColumnsType<PhongHoc.IRecord> = [
    {
      title: 'TT',
      width: 50,
      align: 'center',
      render: (_: any, __: any, index: number) => index + 1 + (page - 1) * limit,
    },
    {
      title: 'Mã phòng',
      dataIndex: 'ma',
      width: 110,
      render: (val: string) => highlight(val),
    },
    {
      title: 'Tên phòng',
      dataIndex: 'ten',
      width: 220,
      render: (val: string) => highlight(val),
    },
    {
      title: 'Loại phòng',
      dataIndex: 'loaiPhong',
      width: 130,
      align: 'center',
      render: (val: PhongHoc.ELoaiPhong) =>
        val ? <Tag color={LOAI_PHONG_COLOR[val]}>{LOAI_PHONG_LABEL[val]}</Tag> : null,
    },
    {
      title: 'Số chỗ ngồi',
      dataIndex: 'soChoNgoi',
      width: 160,
      render: (val: number) => <SeatProgress val={val} />,
    },
    {
      title: 'Người phụ trách',
      dataIndex: 'nguoiPhuTrach',
      width: 170,
    },
    {
      title: 'Thao tác',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (record: PhongHoc.IRecord) => (
        <Space size={0}>
          <Tooltip title="Chỉnh sửa">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <DeleteAction record={record} onDelete={() => deleteModel(record._id, getModel)} />
        </Space>
      ),
    },
  ];

  const emptyState = (
    <Empty description="Không tìm thấy phòng phù hợp" style={{ margin: '40px 0' }}>
      {hasActiveFilters && (
        <Button onClick={clearFilters}>Xóa bộ lọc</Button>
      )}
    </Empty>
  );

  return (
    <div className="phong-hoc-page">
      <Card title="Quản lý phòng học" bordered={false}>

        <Row gutter={12} style={{ marginBottom: 16 }}>
          {STAT_CARDS.map(({ key, label, icon, color }) => (
            <Col key={key} span={6}>
              <Card
                size="small"
                bordered={false}
                style={{ background: `${color}08`, borderLeft: `3px solid ${color}`, borderRadius: 6 }}
                bodyStyle={{ padding: '10px 14px' }}
              >
                <Statistic
                  title={<span style={{ fontSize: 12, color: '#666' }}>{icon}&nbsp;{label}</span>}
                  value={statsByType[key]}
                  valueStyle={{ fontSize: 22, fontWeight: 700, color }}
                  suffix="phòng"
                />
              </Card>
            </Col>
          ))}
        </Row>

        <div className="page-toolbar">
          <Space wrap>
            <Input.Search
              placeholder="Tìm mã, tên phòng..."
              allowClear
              style={{ width: 210 }}
              value={globalSearch}
              onSearch={handleSearch}
              onChange={(e) => { if (!e.target.value) handleSearch(''); else setGlobalSearch(e.target.value); }}
            />
            <Select
              mode="multiple"
              placeholder="Loại phòng"
              allowClear
              style={{ minWidth: 155 }}
              maxTagCount={1}
              value={getFilterValues('loaiPhong')}
              onChange={(v) => updateFilters('loaiPhong', v)}
            >
              {(Object.keys(LOAI_PHONG_LABEL) as PhongHoc.ELoaiPhong[]).map((k) => (
                <Select.Option key={k} value={k}>
                  <Tag color={LOAI_PHONG_COLOR[k]}>{LOAI_PHONG_LABEL[k]}</Tag>
                </Select.Option>
              ))}
            </Select>
            <Select
              mode="multiple"
              placeholder="Người phụ trách"
              allowClear
              style={{ minWidth: 175 }}
              maxTagCount={1}
              value={getFilterValues('nguoiPhuTrach')}
              onChange={(v) => updateFilters('nguoiPhuTrach', v)}
            >
              {DANH_SACH_NGUOI_PHU_TRACH.map((n) => (
                <Select.Option key={n} value={n}>{n}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Sắp xếp số chỗ"
              allowClear
              style={{ width: 165 }}
              value={currentSort}
              onChange={handleSortChange}
              suffixIcon={<SortAscendingOutlined />}
            >
              <Select.Option value="soChoNgoi:1">Số chỗ tăng dần</Select.Option>
              <Select.Option value="soChoNgoi:-1">Số chỗ giảm dần</Select.Option>
            </Select>
          </Space>

          <Space>
            <Tooltip title="Xem dạng bảng">
              <Button
                icon={<UnorderedListOutlined />}
                type={viewMode === 'table' ? 'primary' : 'default'}
                onClick={() => setViewMode('table')}
              />
            </Tooltip>
            <Tooltip title="Xem dạng ô">
              <Button
                icon={<AppstoreOutlined />}
                type={viewMode === 'card' ? 'primary' : 'default'}
                onClick={() => setViewMode('card')}
              />
            </Tooltip>
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={openCreateForm}>
              Thêm mới
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 12 }}>
          {viewMode === 'table' ? (
            <Table
              bordered
              loading={loading}
              rowKey="_id"
              dataSource={danhSach}
              columns={columns}
              pagination={false}
              scroll={{ x: 960 }}
              locale={{ emptyText: emptyState }}
            />
          ) : (
            <Spin spinning={loading}>
              {danhSach.length === 0 ? emptyState : (
                <Row gutter={[16, 16]}>
                  {danhSach.map((room) => (
                    <Col key={room._id} xs={24} sm={12} lg={8} xl={6}>
                      <Card
                        size="small"
                        bordered
                        className="room-card"
                        style={{ borderLeft: `3px solid ${LOAI_PHONG_HEX[room.loaiPhong]}` }}
                        bodyStyle={{ padding: '12px 14px' }}
                      >
                        <div className="room-card-header">
                          <Tag color={LOAI_PHONG_COLOR[room.loaiPhong]}>
                            {LOAI_PHONG_LABEL[room.loaiPhong]}
                          </Tag>
                          <Space size={0}>
                            <Tooltip title="Chỉnh sửa">
                              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(room)} />
                            </Tooltip>
                            <DeleteAction record={room} compact onDelete={() => deleteModel(room._id, getModel)} />
                          </Space>
                        </div>
                        <div className="room-card-ma">{highlight(room.ma)}</div>
                        <div className="room-card-ten">{highlight(room.ten)}</div>
                        <div className="room-card-nguoi">
                          <UserOutlined />
                          <span>{room.nguoiPhuTrach}</span>
                        </div>
                        <SeatProgress val={room.soChoNgoi} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Spin>
          )}
        </div>

        <div className="page-pagination">
          <Pagination
            current={page}
            pageSize={limit}
            total={total}
            showSizeChanger
            pageSizeOptions={['5', '10', '20', '50']}
            showTotal={(t) => `Tổng số: ${t}`}
            onChange={(p, ps) => {
              setPage(p);
              if (ps !== limit) setLimit(ps);
            }}
          />
        </div>
      </Card>

      <Drawer
        visible={visibleForm}
        width={480}
        footer={null}
        bodyStyle={{ padding: 0 }}
        closable={false}
        onClose={() => setVisibleForm(false)}
        destroyOnClose
        extra={
          <Button type="text" icon={<CloseOutlined />} onClick={() => setVisibleForm(false)} />
        }
      >
        <FormPhongHoc title="Phòng học" />
      </Drawer>
    </div>
  );
};

export default QuanLyPhongHocPage;
