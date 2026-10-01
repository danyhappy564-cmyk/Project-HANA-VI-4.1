# HANA-VI_Items — GitHub 에 올리지 않은 번들 파일 목록

`4.1/HANA-VI_Items/mod/bundles.json` 에는 적혀 있지만 **용량 때문에 GitHub 에 일부러 올리지 않은 번들 301개**와
**크기가 0바이트인(깨진) 번들 1개**입니다. R_F 님이 따로 보관하고 있다가 직접 넣습니다 (2026-10-02 확인).

번들이 없으면 그 아이템은 서버에는 등록되지만, 게임에서 3D 모델을 못 불러와 **안 보이거나 클라이언트 오류**가 납니다.
서버 로그에는 `Could not find bundle ... for mod HANA-VI's Items` 로 뜹니다.

**넣는 곳 (둘 중 하나):**
- `4.1/HANA-VI_Items/mod/bundles/` 의 같은 경로 (예: `mags/63tan.bundle`) — 빌드할 때 SPT 로 같이 복사되고 zip 에도 들어갑니다.
  이 경로들은 `.gitignore` 에 등록해 둬서 **넣어도 커밋되지 않습니다.**
- 또는 설치된 `SPT_Runtime\user\mods\HANA-VI_Items\bundles\` 에 직접. (빌드·배포는 이미 있는 파일을 지우지 않습니다)

`assets/virtus_hg_sur.bundle` 은 저장소에 0바이트로 올라가 있어서, 진짜 파일로 덮어쓰면 git 에 "수정됨" 으로 보입니다.
올릴지 말지는 정하시면 됩니다.

## 0바이트(깨진) 파일

- `assets/virtus_hg_sur.bundle`

## 없는 파일 (폴더별)

<details><summary><b>hanavi</b> — 3개</summary>

- `hanavi/mount_SVT40_custom.bundle`
- `hanavi/receiver_vssm.bundle`
- `hanavi/stock_vssm.bundle`

</details>

<details><summary><b>mags</b> — 74개</summary>

- `mags/15pmagblk.bundle`
- `mags/15pmaggrn.bundle`
- `mags/15pmagred.bundle`
- `mags/15pmagtan.bundle`
- `mags/25ak7blk.bundle`
- `mags/25ak7grn.bundle`
- `mags/25ak7red.bundle`
- `mags/25ak7tan.bundle`
- `mags/25pmagblk.bundle`
- `mags/25pmaggrn.bundle`
- `mags/25pmagred.bundle`
- `mags/25pmagtan.bundle`
- `mags/35ak7blkblk.bundle`
- `mags/35ak7blkgrn.bundle`
- `mags/35ak7blkred.bundle`
- `mags/35ak7blktan.bundle`
- `mags/35ak7fdeblk.bundle`
- `mags/35ak7fdegrn.bundle`
- `mags/35ak7fdered.bundle`
- `mags/35ak7fdetan.bundle`
- `mags/35pmagblk.bundle`
- `mags/35pmaggrn.bundle`
- `mags/35pmagred.bundle`
- `mags/35pmagtan.bundle`
- `mags/45pmagblk.bundle`
- `mags/45pmaggrn.bundle`
- `mags/45pmagred.bundle`
- `mags/45pmagtan.bundle`
- `mags/57extendedblk.bundle`
- `mags/57extendedfde.bundle`
- `mags/63blk.bundle`
- `mags/63grn.bundle`
- `mags/63red.bundle`
- `mags/63tan.bundle`
- `mags/9a9130.bundle`
- `mags/CHOPPED60.bundle`
- `mags/aics10plusblk.bundle`
- `mags/aics10plusgrn.bundle`
- `mags/aics10plusred.bundle`
- `mags/aics10plustan.bundle`
- `mags/aics5plusblk.bundle`
- `mags/aics5plusgrn.bundle`
- `mags/aics5plusred.bundle`
- `mags/aics5plustan.bundle`
- `mags/aps35.bundle`
- `mags/aps50.bundle`
- `mags/ash25.bundle`
- `mags/dvl15.bundle`
- `mags/dvl20.bundle`
- `mags/extended1911.bundle`
- `mags/ks23stendo.bundle`
- `mags/mbx140mmred.bundle`
- `mags/mbx170mmred.bundle`
- `mags/mp540.bundle`
- `mags/orsis10.bundle`
- `mags/pp1940.bundle`
- `mags/pp1940red.bundle`
- `mags/pp9140.bundle`
- `mags/pp9160.bundle`
- `mags/saigabuddy.bundle`
- `mags/sr25drum.bundle`
- `mags/sr25plusblk.bundle`
- `mags/sr25plusgrn.bundle`
- `mags/sr25plusred.bundle`
- `mags/sr25plustan.bundle`
- `mags/sr3m35.bundle`
- `mags/sr3m40.bundle`
- `mags/sr3m45.bundle`
- `mags/toz10.bundle`
- `mags/falscar.bundle`
- `mags/arsenal45.bundle`
- `mags/arsenal40.bundle`
- `mags/arsenal35.bundle`
- `mags/m9a3plus.bundle`

</details>

<details><summary><b>g36_mod_0</b> — 9개</summary>

- `g36_mod_0/mount_g36_kac_texture.bundle`
- `g36_mod_0/mount_g36_kac_short.bundle`
- `g36_mod_0/handguard_g36_slimline_e.bundle`
- `g36_mod_0/barrel_g36_390mm_556x45.bundle`
- `g36_mod_0/handguard_g36_hk_export.bundle`
- `g36_mod_0/mount_g36_hk_extended_fixed_sights.bundle`
- `g36_mod_0/mount_g36_hensoldt_upper_ris.bundle`
- `g36_mod_0/mount_g36_kac_long.bundle`
- `g36_mod_0/mount_sl8_1_top_rail.bundle`

</details>

<details><summary><b>tt33mod1</b> — 19개</summary>

- `tt33mod1/textures/client_assets.bundle`
- `tt33mod1/client_assets.bundle`
- `tt33mod1/weapon_toz_tt_762x25tt_container.bundle`
- `tt33mod1/magazine_long.bundle`
- `tt33mod1/magazine_drum.bundle`
- `tt33mod1/ammo_tt_762x25mm_sabot.bundle`
- `tt33mod1/mout_type54_adapter.bundle`
- `tt33mod1/pistolgrip_type_54.bundle`
- `tt33mod1/stock_type80.bundle`
- `tt33mod1/barrel_tt_165mm_mafia.bundle`
- `tt33mod1/muzzle_jp94_3.bundle`
- `tt33mod1/muzzle_tt_mafia.bundle`
- `tt33mod1/mount_tt_short.bundle`
- `tt33mod1/mount_tt_nl.bundle`
- `tt33mod1/mount_rail_tt_nl.bundle`
- `tt33mod1/mount_deco_tt_nl.bundle`
- `tt33mod1/barrel_tt_ak.bundle`
- `tt33mod1/mount_tt_ak.bundle`
- `tt33mod1/magazine_tac.bundle`

</details>

<details><summary><b>mosin_extension</b> — 24개</summary>

- `mosin_extension/axcs/reciever_ax_accuracy_international_mosin.bundle`
- `mosin_extension/axcs/stock_ax_accuracy_international_mosin_butt_stock.bundle`
- `mosin_extension/axcs/pistolgrip_axmc_mosin_texture.bundle`
- `mosin_extension/axcs/pistolgrip_axmc_mosin_grip_adapter.bundle`
- `mosin_extension/axcs/pistolgrip_axmc_mosin.bundle`
- `mosin_extension/axcs/handguard_ax_accuracy_international_mosin_handguard_16_inch_keyslot.bundle`
- `mosin_extension/axcs/foregrip_ax_accuracy_international_mosin_base_pad.bundle`
- `mosin_extension/aics/stock_mosin_aics.bundle`
- `mosin_extension/aics/mag_mosin_mdt_aics_762x54r_texture.bundle`
- `mosin_extension/aics/mag_mosin_mdt_aics_762x54r_10.bundle`
- `mosin_extension/aics/mag_mosin_mdt_aics_762x54r_5.bundle`
- `mosin_extension/aics/mount_kochetov_arbalet_patriot_k_w_mod.bundle`
- `mosin_extension/axcs/reciever_ax_accuracy_international_mosin_blk.bundle`
- `mosin_extension/axcs/stock_ax_accuracy_international_mosin_butt_stock_blk.bundle`
- `mosin_extension/axcs/pistolgrip_axmc_mosin_od.bundle`
- `mosin_extension/axcs/handguard_ax_accuracy_international_mosin_handguard_16_inch_keyslot_blk.bundle`
- `mosin_extension/axcs/foregrip_ax_accuracy_international_mosin_base_pad_od.bundle`
- `mosin_extension/spc/barrel_mosin_integrated_suppressor.bundle`
- `mosin_extension/archangel/chassis_mosin_archangel.bundle`
- `mosin_extension/archangel/bipod_mosin_archangel.bundle`
- `mosin_extension/archangel/mount_mosin_archangel.bundle`
- `mosin_extension/axcs/mount_keyslot_accuracy_international_at_x_forend_rail_ultimax.bundle`
- `mosin_extension/spc/barrel_mosin_800mm_model_1891.bundle`
- `mosin_extension/spc/sight_mosin_model_1891_front.bundle`

</details>

<details><summary><b>shak12</b> — 5개</summary>

- `shak12/silencer_ash12_long.bundle`
- `shak12/barrel_mc558_1.bundle`
- `shak12/handguard_mc558_2.bundle`
- `shak12/sight_ash12_full.bundle`
- `shak12/patron_12,7x55_ps12_sabot.bundle`

</details>

<details><summary><b>MXLR</b> — 38개</summary>

- `MXLR/hammer_m1895_marlin_mxlr_std.bundle`
- `MXLR/tactical_m1895_marlin_mxlr_hammer_spur_extension.bundle`
- `MXLR/trigger_m1895_marlin_mxlr_std.bundle`
- `MXLR/sight_rear_m1895_marlin_mxlr_std.bundle`
- `MXLR/sight_front_m1895_marlin_mxlr_std.bundle`
- `MXLR/charge_m1895_marlin_mxlr_std.bundle`
- `MXLR/mag_m1895_marlin_mxlr_784x49_5.bundle`
- `MXLR/stock_m1895_marlin_mxlr_std.bundle`
- `MXLR/handguard_m1895_marlin_mxlr_std.bundle`
- `MXLR/weapon_marlin_m1895_mxlr_784x49_container.bundle`
- `MXLR/patron_784x49.bundle`
- `MXLR/patron_784x49_lokt.bundle`
- `MXLR/trigger_m1895_ranger_point_precision_trigger_x.bundle`
- `MXLR/tactical_m1895_ranger_point_precision_hammer_spur_extension.bundle`
- `MXLR/charge_m1895_ranger_point_precision_medium_loop_lever.bundle`
- `MXLR/stock_m1895_ranger_point_precision_m_lok_aluminum_stock.bundle`
- `MXLR/stock_m1895_magpul_elg_m_lok.bundle`
- `MXLR/mount_m1895_ranger_point_precision_rhino_5_scope_rail.bundle`
- `MXLR/mount_m1895_xs_marlin_optic_mount.bundle`
- `MXLR/sight_rear_m1895_xs_marlin_ghost_ring.bundle`
- `MXLR/barrel_m1895_marlin_610mm_784x49.bundle`
- `MXLR/sight_front_m1895_xs_marlin_ghost_sight.bundle`
- `MXLR/handguard_m1895_ranger_point_precision_m_lok.bundle`
- `MXLR/handguard_m1895_magpul_elg_m_lok.bundle`
- `MXLR/handguard_m1895_ranger_point_precision_costa_m_lok.bundle`
- `MXLR/mount_m1895_ranger_point_precision_costa_top_rail.bundle`
- `MXLR/trigger_m1895_ranger_point_precision_trigger_x_blk.bundle`
- `MXLR/tactical_m1895_ranger_point_precision_hammer_spur_extension_blk.bundle`
- `MXLR/stock_m1895_ranger_point_precision_m_lok_aluminum_stock_fde.bundle`
- `MXLR/stock_m1895_ranger_point_precision_m_lok_aluminum_stock_grn.bundle`
- `MXLR/handguard_m1895_ranger_point_precision_m_lok_fde.bundle`
- `MXLR/handguard_m1895_ranger_point_precision_m_lok_grn.bundle`
- `MXLR/handguard_m1895_magpul_elg_m_lok_fde.bundle`
- `MXLR/handguard_m1895_ranger_point_precision_costa_m_lok_fde.bundle`
- `MXLR/handguard_m1895_ranger_point_precision_costa_m_lok_grn.bundle`
- `MXLR/stock_m1895_magpul_elg_m_lok_fde.bundle`
- `MXLR/client_assets.bundle`
- `MXLR/textures_client_assets.bundle`

</details>

<details><summary><b>assets</b> — 37개</summary>

- `assets/q191/weapons/q191_58x42_container.bundle`
- `assets/q191/barrel_q191_270mm.bundle`
- `assets/q191/barrel_q191_370mm.bundle`
- `assets/q191/buffer_tube_q191_ar15.bundle`
- `assets/q191/buffer_tube_q191_std.bundle`
- `assets/q191/gas_block_q191_std.bundle`
- `assets/q191/handguard_q191_ll02.bundle`
- `assets/q191/handguard_q191_ly02.bundle`
- `assets/q191/handguard_q191_std.bundle`
- `assets/q191/magazine_q191_30r.bundle`
- `assets/q191/magazine_q191_40r.bundle`
- `assets/q191/pistolgrip_q191_std.bundle`
- `assets/q191/reciever_q191_std.bundle`
- `assets/q191/sight_front_q191_std.bundle`
- `assets/q191/sight_rear_q191_cqb.bundle`
- `assets/q191/stock_q191_std.bundle`
- `assets/q191/stock_q191_pdw.bundle`
- `assets/q191/muzzle_q191_std.bundle`
- `assets/q191/silencers_q191_std.bundle`
- `assets/q191/ammo/dbp141.bundle`
- `assets/q191/ammo/dbp191.bundle`
- `assets/q191/ammo/dvc12.bundle`
- `assets/q191/weapons/audio.bundle`
- `assets/q191/audio.bundle`
- `assets/content/items/mods/handguards/handguard_fb20.bundle`
- `assets/content/items/mods/handguards/handguard_guerilla.bundle`
- `assets/content/items/mods/handguards/handguard_turaco.bundle`
- `assets/content/items/mods/magazines/mag_aug_60.bundle`
- `assets/virtus_weap/virtus_container.bundle`
- `assets/virtus_weap/virtus_textures.bundle`
- `assets/virtus_weap/virtus_sound.bundle`
- `assets/virtus_weap/virtus_anim.bundle`
- `assets/virtus_upper.bundle`
- `assets/vmihgl.bundle`
- `assets/vmihgs.bundle`
- `assets/vmihg11.bundle`
- `assets/vmihgm.bundle`

</details>

<details><summary><b>WeaponM107</b> — 20개</summary>

- `WeaponM107/m107barrel.bundle`
- `WeaponM107/m107barrel20.bundle`
- `WeaponM107/m107barrel20fde.bundle`
- `WeaponM107/m107barrelfde.bundle`
- `WeaponM107/m107bipod.bundle`
- `WeaponM107/m107container.bundle`
- `WeaponM107/m107containerfde.bundle`
- `WeaponM107/m107fmjcartridge.bundle`
- `WeaponM107/m107frontsight.bundle`
- `WeaponM107/m107grip.bundle`
- `WeaponM107/m107hecartridge.bundle`
- `WeaponM107/m107mag.bundle`
- `WeaponM107/m107magfde.bundle`
- `WeaponM107/m107muzzle.bundle`
- `WeaponM107/m107muzzlefde.bundle`
- `WeaponM107/m107rearsight.bundle`
- `WeaponM107/m107suppressor.bundle`
- `WeaponM107/m107suppressorfde.bundle`
- `WeaponM107/m107upperreciever.bundle`
- `WeaponM107/m107upperrecieverfde.bundle`

</details>

<details><summary><b>Weapons</b> — 15개</summary>

- `Weapons/acrbarrel.bundle`
- `Weapons/acrcontainer.bundle`
- `Weapons/acrcoverleft.bundle`
- `Weapons/acrcoverright.bundle`
- `Weapons/acrcoverunder.bundle`
- `Weapons/acrfrontsightimprov.bundle`
- `Weapons/acrfrontsightstandard.bundle`
- `Weapons/acrhandguardstandard.bundle`
- `Weapons/acrhandguardsupp.bundle`
- `Weapons/acrpistolgrip.bundle`
- `Weapons/acrpiston.bundle`
- `Weapons/acrprecstock.bundle`
- `Weapons/acrrearsightstandard.bundle`
- `Weapons/acrstockstandard.bundle`
- `Weapons/acrsuppressor.bundle`

</details>

<details><summary><b>WeaponR5</b> — 11개</summary>

- `WeaponR5/rem5foregrip.bundle`
- `WeaponR5/remingtonr5cont.bundle`
- `WeaponR5/remr5blackfront.bundle`
- `WeaponR5/remr5blackrear.bundle`
- `WeaponR5/remr5buffer.bundle`
- `WeaponR5/remr5chan.bundle`
- `WeaponR5/remr5fdefront.bundle`
- `WeaponR5/remr5fderear.bundle`
- `WeaponR5/remr5gas.bundle`
- `WeaponR5/remr5grip.bundle`
- `WeaponR5/remr5monoupper.bundle`

</details>

<details><summary><b>WeaponCheytac</b> — 26개</summary>

- `WeaponCheytac/408barrellong.bundle`
- `WeaponCheytac/408barrellstandard.bundle`
- `WeaponCheytac/408barrelshort.bundle`
- `WeaponCheytac/408barrelwindrunner.bundle`
- `WeaponCheytac/408bipod.bundle`
- `WeaponCheytac/408bolthandleheavy.bundle`
- `WeaponCheytac/408bolthandlelight.bundle`
- `WeaponCheytac/408bolthandlestandard.bundle`
- `WeaponCheytac/408carryhandleheavy.bundle`
- `WeaponCheytac/408carryhandlelight.bundle`
- `WeaponCheytac/408carryhandlestandard.bundle`
- `WeaponCheytac/408compensator.bundle`
- `WeaponCheytac/408flashhider.bundle`
- `WeaponCheytac/408handguardlong.bundle`
- `WeaponCheytac/408handguardshort.bundle`
- `WeaponCheytac/408magazine.bundle`
- `WeaponCheytac/408muzzlebrake.bundle`
- `WeaponCheytac/408muzzlestandard.bundle`
- `WeaponCheytac/408pistolgrip.bundle`
- `WeaponCheytac/408stockheavy.bundle`
- `WeaponCheytac/408stocklight.bundle`
- `WeaponCheytac/408stockstandard.bundle`
- `WeaponCheytac/408suppressorbig.bundle`
- `WeaponCheytac/408suppressorsock.bundle`
- `WeaponCheytac/ammo_408.bundle`
- `WeaponCheytac/interventioncont.bundle`

</details>

<details><summary><b>weapons</b> — 3개</summary>

- `weapons/qhb/textures/client_assets.bundle`
- `weapons/qhb/client_assets.bundle`
- `weapons/qhb/weapon_colt_m4a1_556x45_container.bundle`

</details>

<details><summary><b>items</b> — 8개</summary>

- `items/mods/handguards/handguard_qhb_q_mlok_12in.bundle`
- `items/mods/handguards/handguard_qhb_q_mlok_6in.bundle`
- `items/mods/barrels/barrel_qhb_190mm_300blk.bundle`
- `items/mods/barrels/barrel_qhb_260mm_300blk.bundle`
- `items/mods/receivers/receiver_qhb_standard.bundle`
- `items/mods/stocks/stock_qhb_standard.bundle`
- `items/mods/muzzles/muzzle_q_cherry_bomb_300blk.bundle`
- `items/mods/suppressors/suppressor_qhb_standard_300blk.bundle`

</details>

<details><summary><b>ATL15_BLK</b> — 3개</summary>

- `ATL15_BLK/textures/client_assets.bundle`
- `ATL15_BLK/client_assets.bundle`
- `ATL15_BLK/weapon_lone_star_tx15_designated_marksman_556x45_container.bundle`

</details>

<details><summary><b>ATL15_FDE</b> — 3개</summary>

- `ATL15_FDE/textures/client_assets.bundle`
- `ATL15_FDE/client_assets.bundle`
- `ATL15_FDE/weapon_lone_star_tx15_designated_marksman_556x45_container.bundle`

</details>

<details><summary><b>SR25</b> — 3개</summary>

- `SR25/textures/client_assets.bundle`
- `SR25/client_assets.bundle`
- `SR25/weapon_container.bundle`

</details>
