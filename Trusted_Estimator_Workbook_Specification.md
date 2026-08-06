# Trusted Estimator Rebuild — Workbook-Derived Implementation Specification
This specification was extracted from the three supplied Mega `.xlsm` workbooks. It is not based on guessed roofing formulas. The attached JSON is the authoritative cell/formula map and the completed asphalt and Euroshield files are regression fixtures.
## Non-negotiable product rule

**Every calculation is automatic. Every calculated value is editable.** Company defaults populate a new estimate, but estimate-level overrides always win and are never silently replaced.
## Proven workbook architecture
- `Input` stores up to 44 building columns and aggregates pitch areas and accessory measurements.
- `B 1` turns those measurements into material, labour, general-requirement, profit and project-total lines.
- `R Data` is the product/rate lookup catalogue used by `VLOOKUP` formulas.
- The completed asphalt and Euroshield workbooks use the same measurements but different product selections, coverages and rates.
## Required measurement inputs
- Row 1: **28778.02304**; aggregate cell `C1`; workbook formula `manual input`; Signal Hill value `Building # `.
- Row 2: **Roofing**; aggregate cell `C2`; workbook formula `manual input`; Signal Hill value `Area`.
- Row 3: **Total Roof Area**; aggregate cell `C3`; workbook formula `SUM(C4:C20)+AX1`; Signal Hill value `3287.000001`.
- Row 4: **Pitch 1**; aggregate cell `C4`; workbook formula `SUM(E4:AV4)`; Signal Hill value `0`.
- Row 5: **Pitch 2**; aggregate cell `C5`; workbook formula `SUM(E5:AV5)`; Signal Hill value `4`.
- Row 6: **Pitch 3**; aggregate cell `C6`; workbook formula `manual input`; Signal Hill value `0`.
- Row 7: **Pitch 4**; aggregate cell `C7`; workbook formula `manual input`; Signal Hill value `0`.
- Row 8: **Pitch 5**; aggregate cell `C8`; workbook formula `manual input`; Signal Hill value `94`.
- Row 9: **Pitch 6**; aggregate cell `C9`; workbook formula `manual input`; Signal Hill value `0`.
- Row 10: **Pitch 7**; aggregate cell `C10`; workbook formula `manual input`; Signal Hill value `3156`.
- Row 11: **Pitch 8**; aggregate cell `C11`; workbook formula `manual input`; Signal Hill value `0`.
- Row 12: **Pitch 9**; aggregate cell `C12`; workbook formula `manual input`; Signal Hill value `33`.
- Row 13: **Pitch 10**; aggregate cell `C13`; workbook formula `manual input`; Signal Hill value `0`.
- Row 14: **Pitch 11**; aggregate cell `C14`; workbook formula `manual input`; Signal Hill value `0`.
- Row 15: **Pitch 12**; aggregate cell `C15`; workbook formula `manual input`; Signal Hill value `0`.
- Row 16: **Pitch 13**; aggregate cell `C16`; workbook formula `manual input`; Signal Hill value `0`.
- Row 17: **Pitch 14**; aggregate cell `C17`; workbook formula `manual input`; Signal Hill value `0`.
- Row 18: **Pitch 15**; aggregate cell `C18`; workbook formula `manual input`; Signal Hill value `0`.
- Row 19: **Pitch 16**; aggregate cell `C19`; workbook formula `manual input`; Signal Hill value `0`.
- Row 20: **Pitch XX (Custom)**; aggregate cell `C20`; workbook formula `manual input`; Signal Hill value `0`.
- Row 22: **Number of Stories**; aggregate cell `C22`; workbook formula `manual input`; Signal Hill value `1`.
- Row 23: **Total Ridges/Hips**; aggregate cell `C23`; workbook formula `SUM(E23:AU23)`; Signal Hill value `320`.
- Row 24: **Total Valleys**; aggregate cell `C24`; workbook formula `SUM(E24:AU24)`; Signal Hill value `153`.
- Row 25: **Total Rakes**; aggregate cell `C25`; workbook formula `manual input`; Signal Hill value `47`.
- Row 26: **Total Eaves**; aggregate cell `C26`; workbook formula `manual input`; Signal Hill value `259`.
- Row 27: **Transition Flashing**; aggregate cell `C27`; workbook formula `manual input`; Signal Hill value `1`.
- Row 28: **Gooseneck  Penetrations**; aggregate cell `C28`; workbook formula `SUM(E28:AU28)`; Signal Hill value `3`.
- Row 29: **Vent  Penetrations**; aggregate cell `C29`; workbook formula `SUM(C3)`; Signal Hill value `3287.000001`.
- Row 30: **Oatey Penetrations**; aggregate cell `C30`; workbook formula `SUM(E30:AU30)`; Signal Hill value `1`.
- Row 31: **"B" vent Penetrations**; aggregate cell `C31`; workbook formula `SUM(E31:AU31)`; Signal Hill value `3`.
- Row 32: **Step Flashing**; aggregate cell `C32`; workbook formula `manual input`; Signal Hill value `53`.
- Row 33: **Wall Flashing**; aggregate cell `C33`; workbook formula `manual input`; Signal Hill value `30`.
- Row 34: **Chimney Backpan**; aggregate cell `C34`; workbook formula `manual input`; Signal Hill value `1`.

## Core calculation rules extracted from B 1
### Row 12 — GAF Timberline HDZ
- Category: `materials`
- Source quantity formula: `Input!C3`
- Asphalt default product/value: `GAF Timberline HDZ`
- Coverage/default: `3`
- Waste/multiplier: `1.08`
- Workbook order formula: `IF(D12<>0,D12,0)*IF(E12<>0,E12,1)*IF(F12<>0,F12,1)*IF(G12<>0,G12,1)*IF(H12<>0,H12,1)/IF(I12<>0,I12,1)`
- Asphalt fixture order quantity: `106.4988000324`
- Euroshield fixture order quantity: `141.9984000432`
- Asphalt line total: `4287`
- Euroshield line total: `15449`

### Row 13 — GAF Weatherblocker Starter Strip
- Category: `materials`
- Source quantity formula: `SUM(Input!C25+Input!C26)`
- Asphalt default product/value: `GAF Weatherblocker Starter Strip`
- Coverage/default: `100`
- Waste/multiplier: `1.1`
- Workbook order formula: `IF(D13<>0,D13,0)*IF(E13<>0,E13,1)*IF(F13<>0,F13,1)*IF(G13<>0,G13,1)*IF(H13<>0,H13,1)/IF(I13<>0,I13,1)`
- Asphalt fixture order quantity: `3.3660000000000005`
- Euroshield fixture order quantity: `11.22`
- Asphalt line total: `176`
- Euroshield line total: `0`

### Row 14 — GAF Seal-A-Ridge
- Category: `materials`
- Source quantity formula: `SUM(Input!C23)`
- Asphalt default product/value: `GAF Seal-A-Ridge`
- Coverage/default: `25`
- Waste/multiplier: `1.1`
- Workbook order formula: `IF(D14<>0,D14,0)*IF(E14<>0,E14,1)*IF(F14<>0,F14,1)*IF(G14<>0,G14,1)*IF(H14<>0,H14,1)/IF(I14<>0,I14,1)`
- Asphalt fixture order quantity: `14.080000000000002`
- Euroshield fixture order quantity: `35.2`
- Asphalt line total: `735`
- Euroshield line total: `2442`

### Row 15 — Specialty Starter Eave
- Category: `materials`
- Source quantity formula: `SUM(Input!C26)`
- Asphalt default product/value: `Specialty Starter Eave`
- Coverage/default: `1`
- Waste/multiplier: `1.1`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `284.90000000000003`
- Euroshield fixture order quantity: `8.555555555555557`
- Asphalt line total: `0`
- Euroshield line total: `477`

### Row 16 — Specialty Starter Rake
- Category: `materials`
- Source quantity formula: `SUM(Input!C25)`
- Asphalt default product/value: `Specialty Starter Rake`
- Coverage/default: `1`
- Waste/multiplier: `1.1`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `51.7`
- Euroshield fixture order quantity: `1.5525525525525528`
- Asphalt line total: `0`
- Euroshield line total: `87`

### Row 17 — Specialty Starter Valley
- Category: `materials`
- Source quantity formula: `SUM(Input!C24)*2`
- Asphalt default product/value: `Specialty Starter Valley`
- Coverage/default: `1`
- Waste/multiplier: `1.1`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `336.6`
- Euroshield fixture order quantity: `8.415000000000001`
- Asphalt line total: `0`
- Euroshield line total: `469`

### Row 18 — Resisto LB1236 36" 
- Category: `materials`
- Source quantity formula: `SUM(Input!C24+Input!C26*E18+Input!C27+(A21*(W21-1)))`
- Asphalt default product/value: `Resisto LB1236 36" `
- Coverage/default: `65`
- Waste/multiplier: `1.02`
- Workbook order formula: `IF(D18<>0,D18,0)*IF(F18<>0,F18,1)*IF(G18<>0,G18,1)*IF(H18<>0,H18,1)/IF(I18<>0,I18,1)`
- Asphalt fixture order quantity: `6.480923076923077`
- Euroshield fixture order quantity: `6.480923076923077`
- Asphalt line total: `428`
- Euroshield line total: `518`

### Row 19 — TriBuilt Synthetic
- Category: `materials`
- Source quantity formula: `SUM(A12-(A18*(W25-1)))`
- Asphalt default product/value: `TriBuilt Synthetic`
- Coverage/default: `1000`
- Waste/multiplier: `1.1`
- Workbook order formula: `IF(D19<>0,D19,0)*IF(E19<>0,E19,1)*IF(F19<>0,F19,1)*IF(G19<>0,G19,1)*IF(H19<>0,H19,1)/IF(I19<>0,I19,1)`
- Asphalt fixture order quantity: `3.1614000011`
- Euroshield fixture order quantity: `3.1614000011`
- Asphalt line total: `229`
- Euroshield line total: `474`

### Row 20 — Drip Edge - 26ga - 1.5" 
- Category: `materials`
- Source quantity formula: `SUM(Input!C26)`
- Asphalt default product/value: `Drip Edge - 26ga - 1.5" `
- Coverage/default: `10`
- Waste/multiplier: `1.15`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `29.784999999999997`
- Euroshield fixture order quantity: `29.784999999999997`
- Asphalt line total: `262`
- Euroshield line total: `262`

### Row 21 — Rake Edge - 26ga - 1" 
- Category: `materials`
- Source quantity formula: `SUM(Input!C25)`
- Asphalt default product/value: `Rake Edge - 26ga - 1" `
- Coverage/default: `10`
- Waste/multiplier: `1.15`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `5.404999999999999`
- Euroshield fixture order quantity: `5.404999999999999`
- Asphalt line total: `40`
- Euroshield line total: `40`

### Row 22 — "W" Valley Flashing - 26ga 
- Category: `materials`
- Source quantity formula: `SUM(Input!C24)`
- Asphalt default product/value: `"W" Valley Flashing - 26ga `
- Coverage/default: `10`
- Waste/multiplier: `1.15`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `17.595`
- Euroshield fixture order quantity: `17.595`
- Asphalt line total: `682`
- Euroshield line total: `682`

### Row 23 — Transition Flashing
- Category: `materials`
- Source quantity formula: `SUM(Input!C27)`
- Asphalt default product/value: `Transition Flashing`
- Coverage/default: `10`
- Waste/multiplier: `1.15`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0.11499999999999999`
- Euroshield fixture order quantity: `1.15`
- Asphalt line total: `3`
- Euroshield line total: `26`

### Row 24 — Step Flashing - 30 ga
- Category: `materials`
- Source quantity formula: `SUM(Input!C32)`
- Asphalt default product/value: `Step Flashing - 30 ga`
- Coverage/default: `0.67`
- Waste/multiplier: `1.1`
- Workbook order formula: `IF(D24<>0,D24,0)*IF(E24<>0,E24,1)*IF(F24<>0,F24,1)*IF(G24<>0,G24,1)*IF(H24<>0,H24,1)/IF(I24<>0,I24,1)`
- Asphalt fixture order quantity: `116.60000000000001`
- Euroshield fixture order quantity: `116.60000000000001`
- Asphalt line total: `78`
- Euroshield line total: `78`

### Row 25 — Wall Flashing - 30ga
- Category: `materials`
- Source quantity formula: `SUM(Input!C33)`
- Asphalt default product/value: `Wall Flashing - 30ga`
- Coverage/default: `10`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `3`
- Euroshield fixture order quantity: `3`
- Asphalt line total: `38`
- Euroshield line total: `38`

### Row 26 — Primex Gooseneck
- Category: `materials`
- Source quantity formula: `SUM(Input!C28)`
- Asphalt default product/value: `Primex Gooseneck`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `3`
- Euroshield fixture order quantity: `3`
- Asphalt line total: `57`
- Euroshield line total: `300`

### Row 27 — WeatherPRO50
- Category: `materials`
- Source quantity formula: `SUM(Input!C29)`
- Asphalt default product/value: `WeatherPRO50`
- Coverage/default: `200`
- Waste/multiplier: `1`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `16.435000005`
- Euroshield fixture order quantity: `4.10875000125`
- Asphalt line total: `205`
- Euroshield line total: `760`

### Row 28 — WeatherPRO50
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `WeatherPRO50`
- Coverage/default: `200`
- Waste/multiplier: `1`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 29 — 4" Oatley
- Category: `materials`
- Source quantity formula: `SUM(Input!C30)`
- Asphalt default product/value: `4" Oatley`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `8`
- Euroshield line total: `8`

### Row 30 — "B" Vent - Chimney Rain Caps & S/C
- Category: `materials`
- Source quantity formula: `SUM(Input!C31)`
- Asphalt default product/value: `"B" Vent - Chimney Rain Caps & S/C`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `3`
- Euroshield fixture order quantity: `3`
- Asphalt line total: `66`
- Euroshield line total: `66`

### Row 31 — "B" Vent - Flange
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `"B" Vent - Flange`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `3`
- Euroshield fixture order quantity: `3`
- Asphalt line total: `39`
- Euroshield line total: `39`

### Row 32 — "B" Vent - Coller Flange
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `"B" Vent - Coller Flange`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `3`
- Euroshield fixture order quantity: `3`
- Asphalt line total: `39`
- Euroshield line total: `39`

### Row 33 — Omniseal 410 Base (Mechanical)
- Category: `materials`
- Source quantity formula: `SUM(Input!C4:C6)`
- Asphalt default product/value: `Omniseal 410 Base (Mechanical)`
- Coverage/default: `1`
- Waste/multiplier: `1.3`
- Workbook order formula: `IF(D33<>0,D33,0)*IF(E33<>0,E33,1)*IF(F33<>0,F33,1)*IF(G33<>0,G33,1)*IF(H33<>0,H33,1)/IF(I33<>0,I33,1)`
- Asphalt fixture order quantity: `2`
- Euroshield fixture order quantity: `2`
- Asphalt line total: `282`
- Euroshield line total: `282`

### Row 34 — Omniseal 420 Base (Self-adhered)
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Omniseal 420 Base (Self-adhered)`
- Coverage/default: `None`
- Waste/multiplier: `1.3`
- Workbook order formula: `IF(D34<>0,D34,0)*IF(E34<>0,E34,1)*IF(F34<>0,F34,1)*IF(G34<>0,G34,1)*IF(H34<>0,H34,1)/IF(I34<>0,I34,1)`
- Asphalt fixture order quantity: `2`
- Euroshield fixture order quantity: `2`
- Asphalt line total: `326`
- Euroshield line total: `326`

### Row 35 — Omniseal 430 Cap Sheet
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Omniseal 430 Cap Sheet`
- Coverage/default: `None`
- Waste/multiplier: `1.3`
- Workbook order formula: `IF(D35<>0,D35,0)*IF(E35<>0,E35,1)*IF(F35<>0,F35,1)*IF(G35<>0,G35,1)*IF(H35<>0,H35,1)/IF(I35<>0,I35,1)`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `182`
- Euroshield line total: `182`

### Row 36 — Caulking
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Caulking`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `17.595`
- Euroshield fixture order quantity: `17.595`
- Asphalt line total: `174`
- Euroshield line total: `174`

### Row 37 — Screws
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Screws`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `IF(D37<>0,D37,0)*IF(E37<>0,E37,1)*IF(F37<>0,F37,1)*IF(G37<>0,G37,1)*IF(H37<>0,H37,1)/IF(I37<>0,I37,1)`
- Asphalt fixture order quantity: `0.55496000008`
- Euroshield fixture order quantity: `0.35774000002`
- Asphalt line total: `43`
- Euroshield line total: `28`

### Row 38 — Chimney Backpan
- Category: `materials`
- Source quantity formula: `SUM(Input!C34)`
- Asphalt default product/value: `Chimney Backpan`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `57`
- Euroshield line total: `57`

### Row 39 — Sheathing / Hot Roof / Skylights
- Category: `materials`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Sheathing / Hot Roof / Skylights`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 40 — Installation
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Installation`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `None`
- Euroshield fixture order quantity: `None`
- Asphalt line total: `None`
- Euroshield line total: `None`

### Row 43 —  0 or 1:12
- Category: `labour`
- Source quantity formula: `A33`
- Asphalt default product/value: ` 0 or 1:12`
- Coverage/default: `0.0012169151198001475`
- Waste/multiplier: `None`
- Workbook order formula: `IF(D43<>0,D43,0)*IF(E43<>0,E43,1)*IF(F43<>0,F43,1)*IF(G43<>0,G43,1)*IF(H43<>0,H43,1)/IF(I43<>0,I43,1)`
- Asphalt fixture order quantity: `0.05027676706001113`
- Euroshield fixture order quantity: `0.05631834499144559`
- Asphalt line total: `26`
- Euroshield line total: `38`

### Row 44 — 0.09166666666666667
- Category: `labour`
- Source quantity formula: `SUM(Input!C5)`
- Asphalt default product/value: `0.09166666666666667`
- Coverage/default: `0.0012169151198001475`
- Waste/multiplier: `None`
- Workbook order formula: `IF(D44<>0,D44,0)*IF(E44<>0,E44,1)*IF(F44<>0,F44,1)*IF(G44<>0,G44,1)*IF(H44<>0,H44,1)/IF(I44<>0,I44,1)`
- Asphalt fixture order quantity: `0.05027676706001113`
- Euroshield fixture order quantity: `0.05631834499144559`
- Asphalt line total: `9`
- Euroshield line total: `13`

### Row 45 — 0.13333333333333333
- Category: `labour`
- Source quantity formula: `SUM(Input!C6)`
- Asphalt default product/value: `0.13333333333333333`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 46 — 0.175
- Category: `labour`
- Source quantity formula: `SUM(Input!C7)`
- Asphalt default product/value: `0.175`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 47 — 0.216666666666667
- Category: `labour`
- Source quantity formula: `SUM(Input!C8)`
- Asphalt default product/value: `0.216666666666667`
- Coverage/default: `0.028597505315303466`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1.1815040259102616`
- Euroshield fixture order quantity: `1.3234811072989714`
- Asphalt line total: `207`
- Euroshield line total: `298`

### Row 48 — 0.258333333333334
- Category: `labour`
- Source quantity formula: `SUM(Input!C9)`
- Asphalt default product/value: `0.258333333333334`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 49 — 0.3
- Category: `labour`
- Source quantity formula: `SUM(Input!C10)`
- Asphalt default product/value: `0.3`
- Coverage/default: `0.9601460295223164`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `39.66836921034878`
- Euroshield fixture order quantity: `44.43517419825058`
- Asphalt line total: `8132`
- Euroshield line total: `11331`

### Row 50 — 0.341666666666667
- Category: `labour`
- Source quantity formula: `SUM(Input!C11)`
- Asphalt default product/value: `0.341666666666667`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 51 — 0.383333333333334
- Category: `labour`
- Source quantity formula: `SUM(Input!C12)`
- Asphalt default product/value: `0.383333333333334`
- Coverage/default: `0.010039549738351217`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0.4147833282450918`
- Euroshield fixture order quantity: `0.46462634617942616`
- Asphalt line total: `131`
- Euroshield line total: `170`

### Row 52 — 0.425
- Category: `labour`
- Source quantity formula: `SUM(Input!C13)`
- Asphalt default product/value: `0.425`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 53 — 0.466666666666667
- Category: `labour`
- Source quantity formula: `SUM(Input!C14)`
- Asphalt default product/value: `0.466666666666667`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 54 — 0.508333333333334
- Category: `labour`
- Source quantity formula: `SUM(Input!C15)`
- Asphalt default product/value: `0.508333333333334`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 55 — 0.55
- Category: `labour`
- Source quantity formula: `SUM(Input!C16)`
- Asphalt default product/value: `0.55`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 56 — 0.591666666666667
- Category: `labour`
- Source quantity formula: `SUM(Input!C17)`
- Asphalt default product/value: `0.591666666666667`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 57 — 0.633333333333334
- Category: `labour`
- Source quantity formula: `SUM(Input!C18)`
- Asphalt default product/value: `0.633333333333334`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 58 — 0.675
- Category: `labour`
- Source quantity formula: `SUM(Input!C19)`
- Asphalt default product/value: `0.675`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 59 — XX:12
- Category: `labour`
- Source quantity formula: `SUM(Input!C20)`
- Asphalt default product/value: `XX:12`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 60 — Chimney Work
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Chimney Work`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `150`
- Euroshield line total: `150`

### Row 61 — Ground Drop
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Ground Drop`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 62 — Ice & Water
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Ice & Water`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 63 — Vents Install (Cut in Vent)
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Vents Install (Cut in Vent)`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 64 — Wall Flashing
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Wall Flashing`
- Coverage/default: `1`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `30`
- Euroshield fixture order quantity: `30`
- Asphalt line total: `75`
- Euroshield line total: `75`

### Row 65 — Step Flashing
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Step Flashing`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `106`
- Euroshield fixture order quantity: `106`
- Asphalt line total: `318`
- Euroshield line total: `318`

### Row 66 — Ridge Vent (Cut in Vent /LF)
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Ridge Vent (Cut in Vent /LF)`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 67 — High Def Cap
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `High Def Cap`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 68 — Oatley Reno (Remove lead pipe cover & iron pipe/ install PVC)
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Oatley Reno (Remove lead pipe cover & iron pipe/ install PVC)`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `IF(D68<>0,D68,0)*IF(E68<>0,E68,1)*IF(F68<>0,F68,1)*IF(G68<>0,G68,1)*IF(H68<>0,H68,1)/IF(I68<>0,I68,1)`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 69 — Sheathing / Hot Roof / Skylights
- Category: `labour`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Sheathing / Hot Roof / Skylights`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 71 — General Requirements
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `General Requirements`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `None`
- Euroshield fixture order quantity: `None`
- Asphalt line total: `Days`
- Euroshield line total: `Days`

### Row 72 — Mobilization/Demobilization
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Mobilization/Demobilization`
- Coverage/default: `None`
- Waste/multiplier: `4`
- Workbook order formula: `IF(D72<>0,D72,0)*IF(E72<>0,E72,1)*IF(F72<>0,F72,1)*IF(G72<>0,G72,1)*IF(H72<>0,H72,1)/IF(I72<>0,I72,1)`
- Asphalt fixture order quantity: `8.262986668826667`
- Euroshield fixture order quantity: `9.25592000216`
- Asphalt line total: `413`
- Euroshield line total: `463`

### Row 73 — Safety - Traffic control
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Safety - Traffic control`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 74 — Safety - Scaffolding OHP
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Safety - Scaffolding OHP`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 75 — Safety - Scaffolding
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Safety - Scaffolding`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 76 — Site Control (Man on the ground)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Site Control (Man on the ground)`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `2.0657466672066667`
- Euroshield fixture order quantity: `2.31398000054`
- Asphalt line total: `72`
- Euroshield line total: `81`

### Row 77 — Site Control (Fence et al)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Site Control (Fence et al)`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 78 — Site Control (Booms)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Site Control (Booms)`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 79 — Disposal (Fee, Labour, Fuel)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Disposal (Fee, Labour, Fuel)`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `32.87000001`
- Euroshield fixture order quantity: `32.87000001`
- Asphalt line total: `1150`
- Euroshield line total: `1479`

### Row 80 — Delivery - Surcharge
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Delivery - Surcharge`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `1`
- Euroshield fixture order quantity: `1`
- Asphalt line total: `500`
- Euroshield line total: `500`

### Row 81 — Delivery - Hoisting
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Delivery - Hoisting`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `133.58712311042308`
- Euroshield fixture order quantity: `198.06072312122308`
- Asphalt line total: `301`
- Euroshield line total: `446`

### Row 82 — Project Manager
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Project Manager`
- Coverage/default: `None`
- Waste/multiplier: `3`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `6.19724000162`
- Euroshield fixture order quantity: `6.94194000162`
- Asphalt line total: `775`
- Euroshield line total: `868`

### Row 83 — Misc. (Park Access)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Misc. (Park Access)`
- Coverage/default: `None`
- Waste/multiplier: `2`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 84 — Misc. (Permits)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Misc. (Permits)`
- Coverage/default: `None`
- Waste/multiplier: `2`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 85 — Misc. Tools & Equipment (XXX)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Misc. Tools & Equipment (XXX)`
- Coverage/default: `None`
- Waste/multiplier: `2`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 86 — Travel time (Crew)
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Travel time (Crew)`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 87 — Hotel
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Hotel`
- Coverage/default: `0`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 88 — Per Diem
- Category: `general_requirements`
- Source quantity formula: `manual / switch`
- Asphalt default product/value: `Per Diem`
- Coverage/default: `None`
- Waste/multiplier: `None`
- Workbook order formula: `manual/formula in adjacent cell`
- Asphalt fixture order quantity: `0`
- Euroshield fixture order quantity: `0`
- Asphalt line total: `0`
- Euroshield line total: `0`

### Row 90 — Project Contingency
- Category: `general_requirements`
- Source quantity formula: `T72`
- Asphalt default product/value: `Project Contingency`
- Coverage/default: `Driver`
- Waste/multiplier: `None`
- Workbook order formula: `IF(D90<>0,D90,0)*IF(E90<>0,E90,1)*IF(F90<>0,F90,1)*IF(G90<>0,G90,1)*IF(H90<>0,H90,1)/IF(I90<>0,I90,1)`
- Asphalt fixture order quantity: `0.04`
- Euroshield fixture order quantity: `0.04`
- Asphalt line total: `851.4208`
- Euroshield line total: `1646.5684000000003`

## Intentional corrections to Mega workbook behaviour
1. Purchasable units must use `ceil` after waste/coverage. The workbook often carries fractional bundles, rolls or pieces and rounds only the dollar extension. The app must quote a fresh standalone order and therefore round every positive fractional purchase quantity upward.
2. Labour remains based on measured quantity unless a labour line itself has a minimum. Do not use rounded material order quantities for labour.
3. Optional lines activate only from an explicit switch or explicit measurement. The mere existence of a rate must never apply it.
4. Each pitch-area row maps only to its matching pitch labour row.
5. Empty numeric inputs remain blank during editing and resolve to zero only during calculation/save. Use a visual `0` placeholder, not a forced input value.
## Regression fixture targets
- `asphalt` cached project total (`B 1!T94`): **28778.02304**
- `asphalt` material subtotal (`B 1!U11`): **9026.52**
- `asphalt` roofing labour subtotal (`B 1!U40`): **9048**
- `asphalt` general requirements (`B 1!U71`): **3211**
- `euroshield` cached project total (`B 1!T94`): **53513.47300000001**
- `euroshield` material subtotal (`B 1!U11`): **24934.210000000003**
- `euroshield` roofing labour subtotal (`B 1!U40`): **12393**
- `euroshield` general requirements (`B 1!U71`): **3837**

## Implementation instructions for Codex
Use `mega_estimator_formula_map.json` as the source map. Do not paraphrase workbook logic into generic rate application. Implement typed formula rules for every active roofing row, then regression-test against both completed workbooks. Preserve estimate-level overrides separately from company defaults.
