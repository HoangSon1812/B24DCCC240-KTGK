declare module PhongHoc {
  export type ELoaiPhong = 'LY_THUYET' | 'THUC_HANH' | 'HOI_TRUONG';

  export interface IRecord {
    _id: string;
    ma: string;
    ten: string;
    soChoNgoi: number;
    loaiPhong: ELoaiPhong;
    nguoiPhuTrach: string;
    createdAt?: string;
    updatedAt?: string;
  }
}
