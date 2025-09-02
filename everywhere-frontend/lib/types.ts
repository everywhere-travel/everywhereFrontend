export interface Persona {
  per_id_int: number
  per_email_vac: string
  per_telf_vac: string
  per_direc_vac: string
  per_obs_vac: string
  per_cre_tmp: Date
  per_upd_tmp: Date
}

export interface PersonaNatural {
  per_nat_id_int: number
  per_nat_doc_int: number
  per_nat_nomb_vac: string
  per_nat_apell_vac: string
  per_nat_cre_tmp: Date
  per_nat_upd_tmp: Date
  per_id_int: number
}

export interface PersonaJuridica {
  per_jurd_id_int: number
  per_jurd_ruc_int: number
  per_jurd_razSocial_vac: string
  per_jurd_cre_tmp: Date
  per_jurd_upd_tmp: Date
  per_id_int: number
}

export interface Viajero {
  via_id_int: number
  via_nomb_vac: string
  via_ap_pat_vac: string
  via_ap_mat_vac: string
  via_fec_nac_tmp: Date
  via_nacio_vac: string
  via_resi_vac: string
  via_tip_doc_vac: string
  via_num_doc_vac: string
  via_fec_emi_doc_tmp: Date
  via_fec_venc_doc_tmp: Date
  via_cre_tmp: Date
  via_upd_tmp: Date
  per_id_int: number
}

export interface Cotizacion {
  cot_id_int: number
  cot_num_vac: string
  cot_cant_adt_int: number
  cot_cant_chd_int: number
  cot_fec_emi_tmp: Date
  cot_fec_venc_tmp: Date
  cot_fec_upd_tmp: Date
  cot_dest_vac: string
  cot_fec_sal_tmp: Date
  cot_fec_reg_tmp: Date
  cot_mon_vac: string
  cot_obs_vac: string
  per_id_int: number
  form_id_int: number
  cou_id_int: number
  est_cot_id_int: number
  suc_id_int: number
  carp_id_int: number
}

export interface DetalleCotizacion {
  dcot_id_int: number
  dcot_cant_int: number
  dcot_und_int: number
  dcot_desc_vac: string
  dcot_prec_hist_dc: number
  dcot_select_bol: boolean
  dcot_cre_tmp: Date
  dcot_upd_tmp: Date
  cot_id_int: number
  prod_id_int: number
  prov_id_int: number
}

export interface Liquidacion {
  liq_id_int: number
  liq_num_vac: string
  liq_fec_comp_tmp: Date
  liq_dest_vac: string
  liq_nro_pasj_int: number
  liq_obsv_vac: string
  liq_fec_cre_tmp: Date
  liq_fec_upd_tmp: Date
  cot_id_int: number
  prod_id_int: number
  form_id_int: number
  carp_id_int: number
}

export interface Producto {
  prod_id_int: number
  prod_cod_vac: string
  prod_desc_vac: string
}

export interface FormaPago {
  form_id_int: number
  form_cod_int: number
  form_desc_vac: string
  form_cre_tmp: Date
  form_upd_tmp: Date
}

export interface EstadoCotizacion {
  est_cot_id_int: number
  est_cot_desc_vac: string
}

export interface Proveedor {
  prov_id_int: number
  prov_nomb_int: string
  prov_cre_tmp: Date
  prov_upd_tmp: Date
}
