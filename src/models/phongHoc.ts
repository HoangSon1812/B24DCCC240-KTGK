import { EOperatorType } from '@/components/Table/constant';
import type { TFilter } from '@/components/Table/typing';
import { message } from 'antd';
import { useState } from 'react';

const STORAGE_KEY = 'quan_ly_phong_hoc';

export const DANH_SACH_NGUOI_PHU_TRACH = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Văn Cường',
  'Phạm Thị Dung',
  'Hoàng Văn Em',
  'Đỗ Thị Phương',
  'Vũ Minh Quang',
];

export const LOAI_PHONG_LABEL: Record<PhongHoc.ELoaiPhong, string> = {
  LY_THUYET: 'Lý thuyết',
  THUC_HANH: 'Thực hành',
  HOI_TRUONG: 'Hội trường',
};

const getInitData = (): PhongHoc.IRecord[] => [
  { _id: '1', ma: 'P101', ten: 'Phòng 101', soChoNgoi: 50, loaiPhong: 'LY_THUYET', nguoiPhuTrach: 'Nguyễn Văn An', createdAt: new Date().toISOString() },
  { _id: '2', ma: 'P201', ten: 'Phòng máy tính 201', soChoNgoi: 30, loaiPhong: 'THUC_HANH', nguoiPhuTrach: 'Trần Thị Bình', createdAt: new Date().toISOString() },
  { _id: '3', ma: 'HT01', ten: 'Hội trường A', soChoNgoi: 200, loaiPhong: 'HOI_TRUONG', nguoiPhuTrach: 'Lê Văn Cường', createdAt: new Date().toISOString() },
  { _id: '4', ma: 'P102', ten: 'Phòng 102', soChoNgoi: 25, loaiPhong: 'LY_THUYET', nguoiPhuTrach: 'Phạm Thị Dung', createdAt: new Date().toISOString() },
  { _id: '5', ma: 'P202', ten: 'Phòng máy tính 202', soChoNgoi: 20, loaiPhong: 'THUC_HANH', nguoiPhuTrach: 'Nguyễn Văn An', createdAt: new Date().toISOString() },
  { _id: '6', ma: 'P103', ten: 'Phòng 103', soChoNgoi: 15, loaiPhong: 'LY_THUYET', nguoiPhuTrach: 'Hoàng Văn Em', createdAt: new Date().toISOString() },
  { _id: '7', ma: 'HT02', ten: 'Hội trường B', soChoNgoi: 150, loaiPhong: 'HOI_TRUONG', nguoiPhuTrach: 'Đỗ Thị Phương', createdAt: new Date().toISOString() },
];

const loadFromStorage = (): PhongHoc.IRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const init = getInitData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  } catch {
    return getInitData();
  }
};

const saveToStorage = (data: PhongHoc.IRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export default () => {
  const [danhSach, setDanhSach] = useState<PhongHoc.IRecord[]>([]);
  const [record, setRecord] = useState<PhongHoc.IRecord | undefined>();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [formSubmiting, setFormSubmiting] = useState<boolean>(false);
  const [filters, setFilters] = useState<TFilter<PhongHoc.IRecord>[]>([]);
  const [condition, setCondition] = useState<any>(undefined);
  const [sort, setSort] = useState<{ [k: string]: 1 | -1 } | undefined>();
  const [edit, setEdit] = useState<boolean>(false);
  const [isView, setIsView] = useState<boolean>(true);
  const [visibleForm, setVisibleForm] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[] | undefined>();
  const [statsByType, setStatsByType] = useState({
    total: 0, LY_THUYET: 0, THUC_HANH: 0, HOI_TRUONG: 0,
    seats: { total: 0, LY_THUYET: 0, THUC_HANH: 0, HOI_TRUONG: 0 },
  });
  const [globalSearch, setGlobalSearch] = useState('');
  const initFilter: TFilter<PhongHoc.IRecord>[] = [];

  const applyClientFilters = (
    data: PhongHoc.IRecord[],
    currentFilters: TFilter<PhongHoc.IRecord>[],
    currentCondition: any,
  ): PhongHoc.IRecord[] => {
    let result = [...data];

    if (globalSearch.trim()) {
      const q = globalSearch.trim().toLowerCase();
      result = result.filter(
        (item) => item.ma?.toLowerCase().includes(q) || item.ten?.toLowerCase().includes(q),
      );
    }

    if (currentCondition) {
      result = result.filter((item) =>
        Object.entries(currentCondition).every(([key, value]) => {
          if (!value) return true;
          return item[key as keyof PhongHoc.IRecord] === value;
        }),
      );
    }

    const activeFilters = (currentFilters ?? []).filter((f) => f.active !== false && f.values?.length);
    result = result.filter((item) =>
      activeFilters.every((filter) => {
        const fieldKey = Array.isArray(filter.field) ? filter.field[0] : filter.field;
        const fieldValue = item[fieldKey as keyof PhongHoc.IRecord];
        const fieldStr = String(fieldValue ?? '').toLowerCase();

        switch (filter.operator) {
          case EOperatorType.CONTAIN:
            return fieldStr.includes(String(filter.values[0] ?? '').toLowerCase());
          case EOperatorType.INCLUDE:
            return filter.values.map((v) => String(v)).includes(String(fieldValue));
          default:
            return true;
        }
      }),
    );

    return result;
  };

  const applyClientSort = (
    data: PhongHoc.IRecord[],
    currentSort: { [k: string]: 1 | -1 } | undefined,
  ): PhongHoc.IRecord[] => {
    if (!currentSort) return data;
    return [...data].sort((a, b) => {
      for (const [field, direction] of Object.entries(currentSort)) {
        const aVal = a[field as keyof PhongHoc.IRecord];
        const bVal = b[field as keyof PhongHoc.IRecord];
        if (aVal === bVal) continue;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction * (aVal - bVal);
        }
        return direction * String(aVal ?? '').localeCompare(String(bVal ?? ''), 'vi');
      }
      return 0;
    });
  };

  const getModel = async (
    _paramCondition?: any,
    _filterParams?: any,
    _sortParam?: any,
    paramPage?: number,
    paramLimit?: number,
  ): Promise<PhongHoc.IRecord[]> => {
    setLoading(true);
    try {
      const allData = loadFromStorage();
      const currentPage = paramPage ?? page;
      const currentLimit = paramLimit ?? limit;

      const byType = (type: PhongHoc.ELoaiPhong) => allData.filter((r) => r.loaiPhong === type);
      setStatsByType({
        total: allData.length,
        LY_THUYET: byType('LY_THUYET').length,
        THUC_HANH: byType('THUC_HANH').length,
        HOI_TRUONG: byType('HOI_TRUONG').length,
        seats: {
          total: allData.reduce((s, r) => s + (r.soChoNgoi || 0), 0),
          LY_THUYET: byType('LY_THUYET').reduce((s, r) => s + (r.soChoNgoi || 0), 0),
          THUC_HANH: byType('THUC_HANH').reduce((s, r) => s + (r.soChoNgoi || 0), 0),
          HOI_TRUONG: byType('HOI_TRUONG').reduce((s, r) => s + (r.soChoNgoi || 0), 0),
        },
      });

      const filtered = applyClientFilters(allData, filters, condition);
      const sorted = applyClientSort(filtered, sort);

      setTotal(sorted.length);

      const start = (currentPage - 1) * currentLimit;
      const pageData = sorted.slice(start, start + currentLimit);
      setDanhSach(pageData);

      return pageData;
    } finally {
      setLoading(false);
    }
  };

  const postModel = async (payload: Partial<PhongHoc.IRecord>): Promise<PhongHoc.IRecord> => {
    if (formSubmiting) return Promise.reject('submitting');
    setFormSubmiting(true);
    try {
      const allData = loadFromStorage();

      if (allData.some((item) => item.ma?.trim().toLowerCase() === payload.ma?.trim().toLowerCase())) {
        message.error('Mã phòng đã tồn tại!');
        return Promise.reject('Duplicate ma');
      }
      if (allData.some((item) => item.ten?.trim().toLowerCase() === payload.ten?.trim().toLowerCase())) {
        message.error('Tên phòng đã tồn tại!');
        return Promise.reject('Duplicate ten');
      }

      const newRecord: PhongHoc.IRecord = {
        ...(payload as PhongHoc.IRecord),
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      saveToStorage([...allData, newRecord]);
      message.success('Thêm mới phòng học thành công!');
      setVisibleForm(false);
      getModel();

      return newRecord;
    } finally {
      setFormSubmiting(false);
    }
  };

  const putModel = async (id: string, payload: Partial<PhongHoc.IRecord>): Promise<PhongHoc.IRecord> => {
    if (formSubmiting) return Promise.reject('submitting');
    setFormSubmiting(true);
    try {
      const allData = loadFromStorage();

      if (allData.some((item) => item.ma?.trim().toLowerCase() === payload.ma?.trim().toLowerCase() && item._id !== id)) {
        message.error('Mã phòng đã tồn tại!');
        return Promise.reject('Duplicate ma');
      }
      if (allData.some((item) => item.ten?.trim().toLowerCase() === payload.ten?.trim().toLowerCase() && item._id !== id)) {
        message.error('Tên phòng đã tồn tại!');
        return Promise.reject('Duplicate ten');
      }

      const updated = allData.map((item) =>
        item._id === id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item,
      );

      saveToStorage(updated);
      message.success('Cập nhật phòng học thành công!');
      setVisibleForm(false);
      getModel();

      return updated.find((item) => item._id === id)!;
    } finally {
      setFormSubmiting(false);
    }
  };

  const deleteModel = async (id: string, getData?: () => void): Promise<void> => {
    setLoading(true);
    try {
      const allData = loadFromStorage();
      const target = allData.find((item) => item._id === id);

      if (!target) return Promise.reject('Not found');

      if (target.soChoNgoi >= 30) {
        message.error('Chỉ được phép xóa phòng có dưới 30 chỗ ngồi!');
        return Promise.reject('Cannot delete');
      }

      saveToStorage(allData.filter((item) => item._id !== id));
      message.success('Xóa phòng học thành công!');

      if (getData) getData();
      else getModel();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rec?: PhongHoc.IRecord) => {
    if (rec) setRecord(rec);
    setEdit(true);
    setIsView(false);
    setVisibleForm(true);
  };

  const handleView = (rec?: PhongHoc.IRecord) => {
    if (rec) setRecord(rec);
    setEdit(false);
    setIsView(true);
    setVisibleForm(true);
  };

  return {
    danhSach,
    setDanhSach,
    record,
    setRecord,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    setLoading,
    formSubmiting,
    setFormSubmiting,
    filters,
    setFilters,
    condition,
    setCondition,
    sort,
    setSort,
    edit,
    setEdit,
    isView,
    setIsView,
    visibleForm,
    setVisibleForm,
    total,
    setTotal,
    selectedIds,
    setSelectedIds,
    initFilter,
    statsByType,
    globalSearch,
    setGlobalSearch,
    getModel,
    postModel,
    putModel,
    deleteModel,
    handleEdit,
    handleView,
    deleteManyModel: undefined as any,
  };
};
