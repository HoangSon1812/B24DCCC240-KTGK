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
  Badge,
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
  Divider,
  Space,
  Spin,
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
      <div style={{ cursor: 'default', minWidth: 100 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: getSeatColor(val), lineHeight: 1 }}>{val}</span>
          <span style={{ fontSize: 11, color: '#bbb' }}>/ 200</span>
        </div>
        <Progress percent={percent} showInfo={false} size="small" strokeColor={getSeatColor(val)} style={{ margin: 0 }} />
      </div>
    </Tooltip>
  );
};

const DeleteAction = ({ record, onDelete }: { record: PhongHoc.IRecord; onDelete: () => void }) => {
  if (record.soChoNgoi < 30) {
    return (
      <Popconfirm
        onConfirm={onDelete}
        title={<span>Xóa phòng <b>{record.ten}</b>?</span>}
        placement="topLeft"
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Button danger type="link" icon={<DeleteOutlined />} />
      </Popconfirm>
    );
  }
  return (
    <Tooltip title={`Phòng có ${record.soChoNgoi} chỗ ≥ 30 — không được phép xóa`}>
      <Button type="link" icon={<LockOutlined />} disabled style={{ color: '#d9d9d9' }} />
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
      width: 90,
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
      <Card
        bordered={false}
        title={
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Quản lý phòng học</span>
              <Badge count={statsByType.total} style={{ backgroundColor: '#1677ff' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, color: '#999', marginTop: 2 }}>
              Quản lý thông tin các phòng học trong trường
            </div>
          </div>
        }
        extra={
          hasActiveFilters ? (
            <span style={{ fontSize: 13, color: '#888' }}>
              Đang lọc&nbsp;<b style={{ color: '#1677ff' }}>{total}</b>&nbsp;/&nbsp;{statsByType.total} phòng
            </span>
          ) : null
        }
      >

        <Row gutter={14} style={{ marginBottom: 20 }}>
          {STAT_CARDS.map(({ key, label, icon, color }) => (
            <Col key={key} span={6}>
              <Card
                bordered={false}
                style={{
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                bodyStyle={{ padding: '16px 20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{label}</span>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: `${color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color, fontSize: 16, flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                </div>
                <div style={{ marginTop: 10, lineHeight: 1 }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color }}>{statsByType[key]}</span>
                </div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>phòng học</div>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="page-toolbar">
          <Space size={0} wrap>
            <Space size={6}>
              <Input.Search
                placeholder="Tìm mã, tên phòng..."
                allowClear
                style={{ width: 190 }}
                value={globalSearch}
                onSearch={handleSearch}
                onChange={(e) => { if (!e.target.value) handleSearch(''); else setGlobalSearch(e.target.value); }}
              />
              <Select
                mode="multiple"
                placeholder="Loại phòng"
                allowClear
                style={{ minWidth: 140 }}
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
                style={{ minWidth: 160 }}
                maxTagCount={1}
                value={getFilterValues('nguoiPhuTrach')}
                onChange={(v) => updateFilters('nguoiPhuTrach', v)}
              >
                {DANH_SACH_NGUOI_PHU_TRACH.map((n) => (
                  <Select.Option key={n} value={n}>{n}</Select.Option>
                ))}
              </Select>
            </Space>

            <Divider type="vertical" style={{ height: 24, margin: '0 10px', borderColor: '#d9d9d9' }} />

            <Select
              placeholder="Sắp xếp số chỗ"
              allowClear
              style={{ width: 155 }}
              value={currentSort}
              onChange={handleSortChange}
              suffixIcon={<SortAscendingOutlined />}
            >
              <Select.Option value="soChoNgoi:1">Tăng dần</Select.Option>
              <Select.Option value="soChoNgoi:-1">Giảm dần</Select.Option>
            </Select>
          </Space>

          <Space size={6}>
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
            <Divider type="vertical" style={{ height: 24, margin: '0 4px', borderColor: '#d9d9d9' }} />
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={openCreateForm}>
              Thêm mới
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 12 }}>
          {viewMode === 'table' ? (
            <Table
              bordered
              size="middle"
              loading={loading}
              rowKey="_id"
              dataSource={danhSach}
              columns={columns}
              pagination={false}
              scroll={{ x: 960 }}
              locale={{ emptyText: emptyState }}
              rowClassName={() => 'phong-hoc-row'}
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
                            <DeleteAction record={room} onDelete={() => deleteModel(room._id, getModel)} />
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
