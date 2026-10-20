/**
 * Writes supabase/migrations/seed_north_america_locations.sql
 * Data-only: countries, pass-through regions, states, cities.
 * Run: node scripts/generate-location-seed.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function sqlStr(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

/** @type {{ slug: string, name: string, iso: string, states: { name: string, code: string, lat: number, lng: number }[] }[]} */
const NEW_COUNTRIES = []

function country(slug, name, iso, states) {
  NEW_COUNTRIES.push({ slug, name, iso, states })
}

const MEXICO_STATES = [
  ['Aguascalientes', 'AGU', 21.8853, -102.2916],
  ['Baja California', 'BCN', 30.8406, -115.2838],
  ['Baja California Sur', 'BCS', 26.0444, -111.6661],
  ['Campeche', 'CAM', 19.8301, -90.5349],
  ['Chiapas', 'CHP', 16.7569, -93.1292],
  ['Chihuahua', 'CHH', 28.6329, -106.0691],
  ['Ciudad de México', 'CMX', 19.4326, -99.1332],
  ['Coahuila', 'COA', 27.0587, -101.7068],
  ['Colima', 'COL', 19.2452, -103.7241],
  ['Durango', 'DUR', 24.0277, -104.6532],
  ['Guanajuato', 'GUA', 21.0190, -101.2574],
  ['Guerrero', 'GRO', 17.4392, -99.5451],
  ['Hidalgo', 'HID', 20.0911, -98.7624],
  ['Jalisco', 'JAL', 20.6595, -103.3494],
  ['México', 'MEX', 19.4969, -99.7233],
  ['Michoacán', 'MIC', 19.5665, -101.7068],
  ['Morelos', 'MOR', 18.6813, -99.1013],
  ['Nayarit', 'NAY', 21.7514, -104.8455],
  ['Nuevo León', 'NLE', 25.5922, -99.9962],
  ['Oaxaca', 'OAX', 17.0732, -96.7266],
  ['Puebla', 'PUE', 19.0414, -98.2063],
  ['Querétaro', 'QUE', 20.5888, -100.3899],
  ['Quintana Roo', 'ROO', 19.1817, -88.4791],
  ['San Luis Potosí', 'SLP', 22.1565, -100.9855],
  ['Sinaloa', 'SIN', 25.1721, -107.4795],
  ['Sonora', 'SON', 29.2972, -110.3309],
  ['Tabasco', 'TAB', 17.8409, -92.6189],
  ['Tamaulipas', 'TAM', 24.2669, -98.8363],
  ['Tlaxcala', 'TLA', 19.3182, -98.2375],
  ['Veracruz', 'VER', 19.1738, -96.1342],
  ['Yucatán', 'YUC', 20.7099, -89.0943],
  ['Zacatecas', 'ZAC', 22.7709, -102.5832],
]

country('guatemala', 'Guatemala', 'GT', [
  ['Alta Verapaz', 'AV', 15.4690, -90.3710],
  ['Baja Verapaz', 'BV', 15.1028, -90.4730],
  ['Chimaltenango', 'CM', 14.6611, -90.8194],
  ['Chiquimula', 'CQ', 14.8000, -89.5458],
  ['El Progreso', 'PR', 14.8500, -90.0167],
  ['Escuintla', 'ES', 14.3000, -90.7850],
  ['Guatemala', 'GU', 14.6349, -90.5069],
  ['Huehuetenango', 'HU', 15.3194, -91.4708],
  ['Izabal', 'IZ', 15.7278, -88.5944],
  ['Jalapa', 'JA', 14.6347, -89.9889],
  ['Jutiapa', 'JU', 14.2917, -89.8958],
  ['Petén', 'PE', 16.9226, -89.8947],
  ['Quetzaltenango', 'QZ', 14.8347, -91.5181],
  ['Quiché', 'QC', 15.0308, -91.1489],
  ['Retalhuleu', 'RE', 14.5361, -91.6778],
  ['Sacatepéquez', 'SA', 14.5573, -90.7337],
  ['San Marcos', 'SM', 14.9639, -91.7944],
  ['Santa Rosa', 'SR', 14.2781, -90.2983],
  ['Sololá', 'SO', 14.7722, -91.1833],
  ['Suchitepéquez', 'SU', 14.5333, -91.4167],
  ['Totonicapán', 'TO', 14.9117, -91.3611],
  ['Zacapa', 'ZA', 14.9719, -89.5308],
])

country('belize', 'Belize', 'BZ', [
  ['Belize', 'BZ', 17.5046, -88.1962],
  ['Cayo', 'CY', 17.1550, -89.0610],
  ['Corozal', 'CZ', 18.3939, -88.3883],
  ['Orange Walk', 'OW', 18.0753, -88.5583],
  ['Stann Creek', 'SC', 16.9700, -88.2300],
  ['Toledo', 'TO', 16.1000, -88.8000],
])

country('honduras', 'Honduras', 'HN', [
  ['Atlántida', 'AT', 15.7597, -86.7897],
  ['Choluteca', 'CH', 13.3003, -87.1908],
  ['Colón', 'CL', 15.9167, -86.0000],
  ['Comayagua', 'CM', 14.4603, -87.6375],
  ['Copán', 'CP', 14.8333, -88.9333],
  ['Cortés', 'CR', 15.5000, -88.0333],
  ['El Paraíso', 'EP', 13.9333, -86.8500],
  ['Francisco Morazán', 'FM', 14.1000, -87.2167],
  ['Gracias a Dios', 'GD', 15.3167, -84.2167],
  ['Intibucá', 'IN', 14.3167, -88.1667],
  ['Islas de la Bahía', 'IB', 16.3333, -86.5333],
  ['La Paz', 'LP', 14.3167, -87.6833],
  ['Lempira', 'LE', 14.5833, -88.5833],
  ['Ocotepeque', 'OC', 14.4333, -89.1833],
  ['Olancho', 'OL', 14.6667, -86.2167],
  ['Santa Bárbara', 'SB', 14.9167, -88.2333],
  ['Valle', 'VA', 13.5333, -87.4833],
  ['Yoro', 'YO', 15.1333, -87.1333],
])

country('el-salvador', 'El Salvador', 'SV', [
  ['Ahuachapán', 'AH', 13.9214, -89.8450],
  ['Cabañas', 'CA', 13.8667, -88.6333],
  ['Chalatenango', 'CH', 14.0333, -88.9333],
  ['Cuscatlán', 'CU', 13.7167, -89.0000],
  ['La Libertad', 'LI', 13.6769, -89.2797],
  ['La Paz', 'PA', 13.4833, -89.0000],
  ['La Unión', 'UN', 13.3369, -87.8439],
  ['Morazán', 'MO', 13.7667, -88.1000],
  ['San Miguel', 'SM', 13.4833, -88.1833],
  ['San Salvador', 'SS', 13.6929, -89.2182],
  ['San Vicente', 'SV', 13.6333, -88.8000],
  ['Santa Ana', 'SA', 13.9942, -89.5597],
  ['Sonsonate', 'SO', 13.7186, -89.7242],
  ['Usulután', 'US', 13.3500, -88.4500],
])

country('nicaragua', 'Nicaragua', 'NI', [
  ['Boaco', 'BO', 12.4722, -85.6586],
  ['Carazo', 'CA', 11.8500, -86.2000],
  ['Chinandega', 'CI', 12.6294, -87.1311],
  ['Chontales', 'CO', 12.1000, -85.3667],
  ['Estelí', 'ES', 13.0919, -86.3539],
  ['Granada', 'GR', 11.9344, -85.9560],
  ['Jinotega', 'JI', 13.0910, -86.0023],
  ['León', 'LE', 12.4344, -86.8778],
  ['Madriz', 'MD', 13.4833, -86.4500],
  ['Managua', 'MN', 12.1364, -86.2514],
  ['Masaya', 'MS', 11.9744, -86.0942],
  ['Matagalpa', 'MT', 12.9256, -85.9175],
  ['Nueva Segovia', 'NS', 13.6333, -86.4833],
  ['Río San Juan', 'RS', 11.1167, -84.7833],
  ['Rivas', 'RI', 11.4372, -85.8263],
  ['Costa Caribe Norte', 'CN', 14.0347, -83.3833],
  ['Costa Caribe Sur', 'CS', 12.0000, -83.7667],
])

country('costa-rica', 'Costa Rica', 'CR', [
  ['San José', 'SJ', 9.9281, -84.0907],
  ['Alajuela', 'A', 10.0162, -84.2116],
  ['Cartago', 'C', 9.8636, -83.9166],
  ['Heredia', 'H', 9.9981, -84.1169],
  ['Guanacaste', 'G', 10.4333, -85.4333],
  ['Puntarenas', 'P', 9.9763, -84.8384],
  ['Limón', 'L', 9.9907, -83.0359],
])

country('panama', 'Panama', 'PA', [
  ['Bocas del Toro', 'BT', 9.3403, -82.2417],
  ['Chiriquí', 'CH', 8.4333, -82.4333],
  ['Coclé', 'CC', 8.4500, -80.4333],
  ['Colón', 'CL', 9.3592, -79.9014],
  ['Darién', 'DA', 8.0000, -77.7500],
  ['Herrera', 'HE', 7.9667, -80.7333],
  ['Los Santos', 'LS', 7.7667, -80.3667],
  ['Panamá', 'PA', 8.9833, -79.5167],
  ['Panamá Oeste', 'PO', 8.8833, -79.7833],
  ['Veraguas', 'VE', 8.1167, -81.0167],
])

country('dominican-republic', 'Dominican Republic', 'DO', [
  ['Distrito Nacional', 'DN', 18.4861, -69.9312],
  ['Azua', 'AZ', 18.4531, -70.7347],
  ['Baoruco', 'BR', 18.4833, -71.3333],
  ['Barahona', 'BH', 18.2085, -71.1008],
  ['Dajabón', 'DA', 19.5488, -71.7083],
  ['Duarte', 'DU', 19.3000, -70.2500],
  ['El Seibo', 'SE', 18.7653, -69.0350],
  ['Elías Piña', 'EP', 19.0000, -71.7000],
  ['Espaillat', 'ES', 19.4500, -70.4833],
  ['Hato Mayor', 'HM', 18.7628, -69.2569],
  ['Hermanas Mirabal', 'MI', 19.4167, -70.3833],
  ['Independencia', 'IN', 18.5000, -71.7500],
  ['La Altagracia', 'AL', 18.6150, -68.7075],
  ['La Romana', 'RO', 18.4273, -68.9728],
  ['La Vega', 'VE', 19.2222, -70.5296],
  ['María Trinidad Sánchez', 'MT', 19.3833, -69.8500],
  ['Monseñor Nouel', 'MN', 18.9167, -70.4000],
  ['Monte Cristi', 'MC', 19.8500, -71.6500],
  ['Monte Plata', 'MP', 18.8070, -69.7840],
  ['Pedernales', 'PN', 18.0378, -71.7440],
  ['Peravia', 'PV', 18.2833, -70.3333],
  ['Puerto Plata', 'PP', 19.7934, -70.6884],
  ['Samaná', 'SM', 19.2056, -69.3364],
  ['San Cristóbal', 'SC', 18.4167, -70.1000],
  ['San José de Ocoa', 'JO', 18.5467, -70.5064],
  ['San Juan', 'SJ', 18.8056, -71.2297],
  ['San Pedro de Macorís', 'PM', 18.4539, -69.3086],
  ['Sánchez Ramírez', 'SR', 19.0500, -70.1500],
  ['Santiago', 'ST', 19.4517, -70.6970],
  ['Santiago Rodríguez', 'SZ', 19.4833, -71.3333],
  ['Santo Domingo', 'SD', 18.5000, -69.9000],
  ['Valverde', 'VA', 19.5667, -71.0833],
])

country('trinidad-and-tobago', 'Trinidad and Tobago', 'TT', [
  ['Port of Spain', 'POS', 10.6603, -61.5086],
  ['San Fernando', 'SFO', 10.2797, -61.4683],
  ['Chaguanas', 'CHA', 10.5167, -61.4167],
  ['Arima', 'ARI', 10.6374, -61.2823],
  ['Point Fortin', 'PTF', 10.1744, -61.6842],
  ['Diego Martin', 'DMN', 10.7200, -61.5667],
  ['San Juan-Laventille', 'SJL', 10.6500, -61.4500],
  ['Tunapuna-Piarco', 'TUP', 10.6500, -61.3833],
  ['Sangre Grande', 'SGE', 10.5872, -61.1300],
  ['Couva-Tabaquite-Talparo', 'CTT', 10.4231, -61.4672],
  ['Princes Town', 'PRT', 10.2718, -61.3712],
  ['Penal-Debe', 'PED', 10.1667, -61.4500],
  ['Siparia', 'SIP', 10.1453, -61.5072],
  ['Mayaro-Rio Claro', 'MRC', 10.2833, -61.0167],
  ['Tobago', 'TOB', 11.1800, -60.7300],
])

// country|stateCode|City|lat|lng  — real places only
const CITY_LINES = `
united-states|TX|Houston|29.7604|-95.3698
united-states|TX|Midland|31.9973|-102.0779
united-states|TX|Odessa|31.8457|-102.3676
united-states|TX|Dallas|32.7767|-96.7970
united-states|TX|Fort Worth|32.7555|-97.3308
united-states|TX|San Antonio|29.4241|-98.4936
united-states|TX|Austin|30.2672|-97.7431
united-states|TX|Corpus Christi|27.8006|-97.3964
united-states|TX|Beaumont|30.0802|-94.1266
united-states|TX|Lubbock|33.5779|-101.8552
united-states|TX|Amarillo|35.2220|-101.8313
united-states|TX|El Paso|31.7619|-106.4850
united-states|OK|Oklahoma City|35.4676|-97.5164
united-states|OK|Tulsa|36.1540|-95.9928
united-states|OK|Norman|35.2226|-97.4395
united-states|OK|Lawton|34.6036|-98.3959
united-states|OK|Enid|36.3956|-97.8784
united-states|OK|Broken Arrow|36.0609|-95.7975
united-states|LA|New Orleans|29.9511|-90.0715
united-states|LA|Baton Rouge|30.4515|-91.1871
united-states|LA|Shreveport|32.5252|-93.7502
united-states|LA|Lafayette|30.2241|-92.0198
united-states|LA|Lake Charles|30.2266|-93.2174
united-states|LA|Houma|29.5958|-90.7195
united-states|ND|Williston|48.1470|-103.6180
united-states|ND|Fargo|46.8772|-96.7898
united-states|ND|Bismarck|46.8083|-100.7837
united-states|ND|Minot|48.2330|-101.2923
united-states|ND|Grand Forks|47.9253|-97.0329
united-states|ND|Dickinson|46.8792|-102.7896
united-states|CA|Los Angeles|34.0522|-118.2437
united-states|CA|Bakersfield|35.3733|-119.0187
united-states|CA|Long Beach|33.7701|-118.1937
united-states|CA|Fresno|36.7378|-119.7871
united-states|CA|San Diego|32.7157|-117.1611
united-states|CA|Sacramento|38.5816|-121.4944
united-states|CA|Oakland|37.8044|-122.2712
united-states|CA|San Jose|37.3382|-121.8863
united-states|AZ|Phoenix|33.4484|-112.0740
united-states|AZ|Tucson|32.2226|-110.9747
united-states|AZ|Mesa|33.4152|-111.8315
united-states|AZ|Chandler|33.3062|-111.8413
united-states|AZ|Flagstaff|35.1983|-111.6513
united-states|AZ|Yuma|32.6927|-114.6277
united-states|NM|Albuquerque|35.0844|-106.6504
united-states|NM|Santa Fe|35.6870|-105.9378
united-states|NM|Las Cruces|32.3199|-106.7637
united-states|NM|Farmington|36.7281|-108.2187
united-states|NM|Hobbs|32.7026|-103.1360
united-states|NM|Roswell|33.3943|-104.5230
united-states|CO|Denver|39.7392|-104.9903
united-states|CO|Colorado Springs|38.8339|-104.8214
united-states|CO|Aurora|39.7294|-104.8319
united-states|CO|Fort Collins|40.5853|-105.0844
united-states|CO|Grand Junction|39.0639|-108.5506
united-states|CO|Pueblo|38.2544|-104.6091
united-states|WY|Casper|42.8666|-106.3131
united-states|WY|Cheyenne|41.1400|-104.8202
united-states|WY|Gillette|44.2911|-105.5022
united-states|WY|Rock Springs|41.5875|-109.2029
united-states|WY|Laramie|41.3114|-105.5911
united-states|WY|Sheridan|44.7972|-106.9562
united-states|MT|Billings|45.7833|-108.5007
united-states|MT|Missoula|46.8721|-113.9940
united-states|MT|Great Falls|47.5053|-111.3008
united-states|MT|Bozeman|45.6770|-111.0429
united-states|MT|Helena|46.5891|-112.0391
united-states|MT|Kalispell|48.1958|-114.3136
united-states|KS|Wichita|37.6872|-97.3301
united-states|KS|Kansas City|39.1142|-94.6275
united-states|KS|Topeka|39.0473|-95.6752
united-states|KS|Overland Park|38.9822|-94.6708
united-states|KS|Olathe|38.8814|-94.8191
united-states|KS|Lawrence|38.9717|-95.2353
united-states|NE|Omaha|41.2565|-95.9345
united-states|NE|Lincoln|40.8136|-96.7026
united-states|NE|Bellevue|41.1544|-95.9146
united-states|NE|Grand Island|40.9264|-98.3420
united-states|NE|Kearney|40.6995|-99.0815
united-states|NE|North Platte|41.1239|-100.7654
united-states|AR|Little Rock|34.7465|-92.2896
united-states|AR|Fort Smith|35.3859|-94.3985
united-states|AR|Fayetteville|36.0626|-94.1574
united-states|AR|Springdale|36.1867|-94.1288
united-states|AR|Jonesboro|35.8423|-90.7043
united-states|AR|El Dorado|33.2076|-92.6663
united-states|MS|Jackson|32.2988|-90.1848
united-states|MS|Gulfport|30.3674|-89.0928
united-states|MS|Southaven|34.9890|-90.0126
united-states|MS|Hattiesburg|31.3271|-89.2903
united-states|MS|Biloxi|30.3960|-88.8853
united-states|MS|Meridian|32.3643|-88.7037
united-states|AL|Birmingham|33.5207|-86.8025
united-states|AL|Montgomery|32.3668|-86.3000
united-states|AL|Mobile|30.6954|-88.0399
united-states|AL|Huntsville|34.7304|-86.5861
united-states|AL|Tuscaloosa|33.2098|-87.5692
united-states|AL|Decatur|34.6059|-86.9833
united-states|TN|Nashville|36.1627|-86.7816
united-states|TN|Memphis|35.1495|-90.0490
united-states|TN|Knoxville|35.9606|-83.9207
united-states|TN|Chattanooga|35.0456|-85.3097
united-states|TN|Clarksville|36.5298|-87.3595
united-states|TN|Murfreesboro|35.8456|-86.3903
united-states|KY|Louisville|38.2527|-85.7585
united-states|KY|Lexington|38.0406|-84.5037
united-states|KY|Bowling Green|36.9685|-86.4808
united-states|KY|Owensboro|37.7719|-87.1112
united-states|KY|Covington|39.0837|-84.5086
united-states|KY|Paducah|37.0834|-88.6000
united-states|FL|Miami|25.7617|-80.1918
united-states|FL|Jacksonville|30.3322|-81.6557
united-states|FL|Tampa|27.9506|-82.4572
united-states|FL|Orlando|28.5383|-81.3792
united-states|FL|Fort Lauderdale|26.1224|-80.1373
united-states|FL|Pensacola|30.4213|-87.2169
united-states|GA|Atlanta|33.7490|-84.3880
united-states|GA|Savannah|32.0809|-81.0912
united-states|GA|Augusta|33.4735|-82.0105
united-states|GA|Columbus|32.4610|-84.9877
united-states|GA|Macon|32.8407|-83.6324
united-states|GA|Athens|33.9519|-83.3576
united-states|SC|Charleston|32.7765|-79.9311
united-states|SC|Columbia|34.0007|-81.0348
united-states|SC|Greenville|34.8526|-82.3940
united-states|SC|Myrtle Beach|33.6891|-78.8867
united-states|SC|Spartanburg|34.9496|-81.9320
united-states|SC|Rock Hill|34.9249|-81.0251
united-states|NC|Charlotte|35.2271|-80.8431
united-states|NC|Raleigh|35.7796|-78.6382
united-states|NC|Greensboro|36.0726|-79.7920
united-states|NC|Durham|35.9940|-78.8986
united-states|NC|Winston-Salem|36.0999|-80.2442
united-states|NC|Wilmington|34.2257|-77.9447
united-states|VA|Virginia Beach|36.8529|-75.9780
united-states|VA|Norfolk|36.8508|-76.2859
united-states|VA|Richmond|37.5407|-77.4360
united-states|VA|Arlington|38.8816|-77.0910
united-states|VA|Newport News|37.0871|-76.4730
united-states|VA|Roanoke|37.2710|-79.9414
united-states|WV|Charleston|38.3498|-81.6326
united-states|WV|Huntington|38.4192|-82.4452
united-states|WV|Morgantown|39.6295|-79.9559
united-states|WV|Parkersburg|39.2667|-81.5615
united-states|WV|Wheeling|40.0640|-80.7209
united-states|WV|Beckley|37.7782|-81.1882
united-states|NV|Las Vegas|36.1699|-115.1398
united-states|NV|Henderson|36.0395|-114.9817
united-states|NV|Reno|39.5296|-119.8138
united-states|NV|North Las Vegas|36.1989|-115.1175
united-states|NV|Sparks|39.5349|-119.7527
united-states|NV|Elko|40.8324|-115.7631
united-states|UT|Salt Lake City|40.7608|-111.8910
united-states|UT|West Valley City|40.6916|-112.0011
united-states|UT|Provo|40.2338|-111.6585
united-states|UT|West Jordan|40.6097|-111.9391
united-states|UT|Ogden|41.2230|-111.9738
united-states|UT|St. George|37.0965|-113.5684
united-states|ID|Boise|43.6150|-116.2023
united-states|ID|Meridian|43.6121|-116.3915
united-states|ID|Nampa|43.5407|-116.5635
united-states|ID|Idaho Falls|43.4917|-112.0339
united-states|ID|Pocatello|42.8713|-112.4455
united-states|ID|Twin Falls|42.5558|-114.4701
united-states|WA|Seattle|47.6062|-122.3321
united-states|WA|Spokane|47.6588|-117.4260
united-states|WA|Tacoma|47.2529|-122.4443
united-states|WA|Vancouver|45.6387|-122.6615
united-states|WA|Bellevue|47.6101|-122.2015
united-states|WA|Everett|47.9790|-122.2021
united-states|OR|Portland|45.5152|-122.6784
united-states|OR|Eugene|44.0521|-123.0868
united-states|OR|Salem|44.9429|-123.0351
united-states|OR|Gresham|45.4984|-122.4311
united-states|OR|Bend|44.0582|-121.3153
united-states|OR|Medford|42.3265|-122.8756
united-states|AK|Anchorage|61.2181|-149.9003
united-states|AK|Fairbanks|64.8378|-147.7164
united-states|AK|Juneau|58.3019|-134.4197
united-states|AK|Sitka|57.0531|-135.3300
united-states|AK|Ketchikan|55.3422|-131.6461
united-states|AK|Kenai|60.5544|-151.2583
united-states|HI|Honolulu|21.3069|-157.8583
united-states|HI|Hilo|19.7297|-155.0900
united-states|HI|Kailua|21.4022|-157.7394
united-states|HI|Kaneohe|21.4181|-157.8036
united-states|HI|Pearl City|21.3972|-157.9753
united-states|HI|Kahului|20.8893|-156.4729
united-states|SD|Sioux Falls|43.5460|-96.7313
united-states|SD|Rapid City|44.0805|-103.2310
united-states|SD|Aberdeen|45.4647|-98.4865
united-states|SD|Brookings|44.3114|-96.7984
united-states|SD|Watertown|44.8994|-97.1151
united-states|SD|Pierre|44.3683|-100.3510
united-states|MN|Minneapolis|44.9778|-93.2650
united-states|MN|Saint Paul|44.9537|-93.0900
united-states|MN|Rochester|44.0121|-92.4802
united-states|MN|Duluth|46.7867|-92.1005
united-states|MN|Bloomington|44.8408|-93.2983
united-states|MN|St. Cloud|45.5579|-94.1632
united-states|IA|Des Moines|41.5868|-93.6250
united-states|IA|Cedar Rapids|41.9779|-91.6656
united-states|IA|Davenport|41.5236|-90.5776
united-states|IA|Sioux City|42.4990|-96.4003
united-states|IA|Iowa City|41.6611|-91.5302
united-states|IA|Waterloo|42.4928|-92.3426
united-states|MO|Kansas City|39.0997|-94.5786
united-states|MO|St. Louis|38.6270|-90.1994
united-states|MO|Springfield|37.2090|-93.2923
united-states|MO|Columbia|38.9517|-92.3341
united-states|MO|Independence|39.0911|-94.4155
united-states|MO|Joplin|37.0842|-94.5133
united-states|WI|Milwaukee|43.0389|-87.9065
united-states|WI|Madison|43.0731|-89.4012
united-states|WI|Green Bay|44.5133|-88.0133
united-states|WI|Kenosha|42.5847|-87.8212
united-states|WI|Racine|42.7261|-87.7829
united-states|WI|Appleton|44.2619|-88.4154
united-states|IL|Chicago|41.8781|-87.6298
united-states|IL|Aurora|41.7606|-88.3201
united-states|IL|Naperville|41.7508|-88.1535
united-states|IL|Rockford|42.2711|-89.0940
united-states|IL|Joliet|41.5250|-88.0817
united-states|IL|Springfield|39.7817|-89.6501
united-states|MI|Detroit|42.3314|-83.0458
united-states|MI|Grand Rapids|42.9634|-85.6681
united-states|MI|Warren|42.5145|-83.0147
united-states|MI|Ann Arbor|42.2808|-83.7430
united-states|MI|Lansing|42.7325|-84.5555
united-states|MI|Flint|43.0125|-83.6875
united-states|IN|Indianapolis|39.7684|-86.1581
united-states|IN|Fort Wayne|41.0793|-85.1394
united-states|IN|Evansville|37.9716|-87.5711
united-states|IN|South Bend|41.6764|-86.2520
united-states|IN|Carmel|39.9784|-86.1180
united-states|IN|Bloomington|39.1653|-86.5264
united-states|OH|Columbus|39.9612|-82.9988
united-states|OH|Cleveland|41.4993|-81.6944
united-states|OH|Cincinnati|39.1031|-84.5120
united-states|OH|Toledo|41.6528|-83.5379
united-states|OH|Akron|41.0814|-81.5190
united-states|OH|Dayton|39.7589|-84.1916
united-states|PA|Philadelphia|39.9526|-75.1652
united-states|PA|Pittsburgh|40.4406|-79.9959
united-states|PA|Allentown|40.6084|-75.4902
united-states|PA|Erie|42.1292|-80.0851
united-states|PA|Reading|40.3356|-75.9269
united-states|PA|Scranton|41.4090|-75.6624
united-states|NY|New York|40.7128|-74.0060
united-states|NY|Buffalo|42.8864|-78.8784
united-states|NY|Rochester|43.1566|-77.6088
united-states|NY|Yonkers|40.9312|-73.8988
united-states|NY|Syracuse|43.0481|-76.1474
united-states|NY|Albany|42.6526|-73.7562
united-states|NJ|Newark|40.7357|-74.1724
united-states|NJ|Jersey City|40.7178|-74.0431
united-states|NJ|Paterson|40.9168|-74.1718
united-states|NJ|Elizabeth|40.6640|-74.2107
united-states|NJ|Edison|40.5187|-74.4121
united-states|NJ|Trenton|40.2171|-74.7429
united-states|MA|Boston|42.3601|-71.0589
united-states|MA|Worcester|42.2626|-71.8023
united-states|MA|Springfield|42.1015|-72.5898
united-states|MA|Cambridge|42.3736|-71.1097
united-states|MA|Lowell|42.6334|-71.3162
united-states|MA|New Bedford|41.6362|-70.9342
united-states|CT|Bridgeport|41.1865|-73.1952
united-states|CT|New Haven|41.3083|-72.9279
united-states|CT|Stamford|41.0534|-73.5387
united-states|CT|Hartford|41.7658|-72.6734
united-states|CT|Waterbury|41.5582|-73.0515
united-states|CT|Norwalk|41.1176|-73.4079
united-states|RI|Providence|41.8240|-71.4128
united-states|RI|Warwick|41.7001|-71.4162
united-states|RI|Cranston|41.7798|-71.4373
united-states|RI|Pawtucket|41.8787|-71.3826
united-states|RI|East Providence|41.8137|-71.3701
united-states|RI|Newport|41.4901|-71.3128
united-states|NH|Manchester|42.9956|-71.4548
united-states|NH|Nashua|42.7654|-71.4676
united-states|NH|Concord|43.2081|-71.5376
united-states|NH|Dover|43.1979|-70.8737
united-states|NH|Rochester|43.3045|-70.9756
united-states|NH|Keene|42.9337|-72.2781
united-states|VT|Burlington|44.4759|-73.2121
united-states|VT|South Burlington|44.4670|-73.1710
united-states|VT|Rutland|43.6106|-72.9726
united-states|VT|Montpelier|44.2601|-72.5754
united-states|VT|Barre|44.1970|-72.5020
united-states|VT|St. Albans|44.8109|-73.0832
united-states|ME|Portland|43.6591|-70.2568
united-states|ME|Lewiston|44.1004|-70.2148
united-states|ME|Bangor|44.8016|-68.7712
united-states|ME|South Portland|43.6415|-70.2409
united-states|ME|Auburn|44.0979|-70.2312
united-states|ME|Augusta|44.3106|-69.7795
united-states|MD|Baltimore|39.2904|-76.6122
united-states|MD|Frederick|39.4143|-77.4105
united-states|MD|Rockville|39.0840|-77.1528
united-states|MD|Gaithersburg|39.1434|-77.2014
united-states|MD|Bowie|39.0068|-76.7791
united-states|MD|Annapolis|38.9784|-76.4922
united-states|DE|Wilmington|39.7391|-75.5398
united-states|DE|Dover|39.1582|-75.5244
united-states|DE|Newark|39.6837|-75.7497
united-states|DE|Middletown|39.4496|-75.7163
united-states|DE|Smyrna|39.2998|-75.6046
united-states|DE|Milford|38.9126|-75.4277
united-states|DC|Washington|38.9072|-77.0369
united-states|DC|Georgetown|38.9096|-77.0654
united-states|DC|Anacostia|38.8660|-76.9850
united-states|DC|Capitol Hill|38.8899|-77.0091
united-states|DC|Navy Yard|38.8765|-77.0006
united-states|DC|Brookland|38.9320|-76.9840
canada|AB|Calgary|51.0447|-114.0719
canada|AB|Edmonton|53.5461|-113.4938
canada|AB|Fort McMurray|56.7267|-111.3790
canada|AB|Red Deer|52.2681|-113.8112
canada|AB|Lethbridge|49.6956|-112.8451
canada|AB|Grande Prairie|55.1707|-118.7947
canada|AB|Medicine Hat|50.0405|-110.6764
canada|BC|Vancouver|49.2827|-123.1207
canada|BC|Victoria|48.4284|-123.3656
canada|BC|Surrey|49.1913|-122.8490
canada|BC|Burnaby|49.2488|-122.9805
canada|BC|Kelowna|49.8880|-119.4960
canada|BC|Prince George|53.9171|-122.7497
canada|MB|Winnipeg|49.8951|-97.1384
canada|MB|Brandon|49.8485|-99.9501
canada|MB|Steinbach|49.5258|-96.6845
canada|MB|Thompson|55.7435|-97.8553
canada|MB|Portage la Prairie|49.9728|-98.2926
canada|NB|Moncton|46.0878|-64.7782
canada|NB|Saint John|45.2733|-66.0633
canada|NB|Fredericton|45.9636|-66.6431
canada|NB|Dieppe|46.0989|-64.7242
canada|NB|Miramichi|47.0286|-65.5019
canada|NL|St. John's|47.5615|-52.7126
canada|NL|Mount Pearl|47.5189|-52.8058
canada|NL|Corner Brook|48.9511|-57.9527
canada|NL|Conception Bay South|47.5167|-52.9833
canada|NL|Grand Falls-Windsor|48.9333|-55.6500
canada|NS|Halifax|44.6488|-63.5752
canada|NS|Dartmouth|44.6713|-63.5772
canada|NS|Sydney|46.1368|-60.1942
canada|NS|Truro|45.3647|-63.2800
canada|NS|New Glasgow|45.5833|-62.6500
canada|ON|Toronto|43.6532|-79.3832
canada|ON|Ottawa|45.4215|-75.6972
canada|ON|Mississauga|43.5890|-79.6441
canada|ON|Hamilton|43.2557|-79.8711
canada|ON|London|42.9849|-81.2453
canada|ON|Windsor|42.3149|-83.0364
canada|ON|Sudbury|46.4917|-80.9930
canada|PE|Charlottetown|46.2382|-63.1311
canada|PE|Summerside|46.3959|-63.7891
canada|PE|Stratford|46.2167|-63.0833
canada|PE|Cornwall|46.2264|-63.2181
canada|PE|Montague|46.1667|-62.6500
canada|QC|Montreal|45.5017|-73.5673
canada|QC|Quebec City|46.8139|-71.2080
canada|QC|Laval|45.6066|-73.7124
canada|QC|Gatineau|45.4765|-75.7013
canada|QC|Longueuil|45.5312|-73.5185
canada|QC|Sherbrooke|45.4042|-71.8929
canada|SK|Saskatoon|52.1332|-106.6700
canada|SK|Regina|50.4452|-104.6189
canada|SK|Prince Albert|53.2033|-105.7531
canada|SK|Moose Jaw|50.3933|-105.5519
canada|SK|Estevan|49.1392|-102.9861
canada|NT|Yellowknife|62.4540|-114.3718
canada|NT|Hay River|60.8156|-115.7999
canada|NT|Inuvik|68.3607|-133.7230
canada|NT|Fort Smith|60.0053|-111.8847
canada|NT|Norman Wells|65.2820|-126.8329
canada|NU|Iqaluit|63.7467|-68.5170
canada|NU|Rankin Inlet|62.8090|-92.0853
canada|NU|Arviat|61.1086|-94.0624
canada|NU|Cambridge Bay|69.1169|-105.0597
canada|NU|Baker Lake|64.3190|-96.0209
canada|YT|Whitehorse|60.7212|-135.0568
canada|YT|Dawson City|64.0600|-139.4320
canada|YT|Watson Lake|60.0634|-128.7160
canada|YT|Haines Junction|60.7522|-137.5108
canada|YT|Carmacks|62.0881|-136.2897
mexico|JAL|Guadalajara|20.6597|-103.3496
mexico|JAL|Zapopan|20.7214|-103.3918
mexico|JAL|Puerto Vallarta|20.6534|-105.2253
mexico|JAL|Tlaquepaque|20.6409|-103.2933
mexico|JAL|Lagos de Moreno|21.3567|-101.9292
mexico|NLE|Monterrey|25.6866|-100.3161
mexico|NLE|San Pedro Garza García|25.6572|-100.4022
mexico|NLE|Guadalupe|25.6768|-100.2565
mexico|NLE|Apodaca|25.7819|-100.1886
mexico|NLE|San Nicolás de los Garza|25.7417|-100.3022
mexico|TAM|Reynosa|26.0922|-98.2778
mexico|TAM|Matamoros|25.8690|-97.5027
mexico|TAM|Nuevo Laredo|27.4763|-99.5164
mexico|TAM|Tampico|22.2331|-97.8611
mexico|TAM|Ciudad Victoria|23.7369|-99.1411
mexico|TAM|Ciudad Madero|22.2760|-97.8360
mexico|COA|Saltillo|25.4232|-101.0053
mexico|COA|Torreón|25.5428|-103.4068
mexico|COA|Monclova|26.9103|-101.4222
mexico|COA|Piedras Negras|28.7000|-100.5231
mexico|COA|Acuña|29.3232|-100.9520
mexico|CHH|Chihuahua|28.6353|-106.0889
mexico|CHH|Ciudad Juárez|31.6904|-106.4245
mexico|CHH|Delicias|28.1906|-105.4701
mexico|CHH|Cuauhtémoc|28.4050|-106.8666
mexico|CHH|Parral|26.9303|-105.6664
mexico|SON|Hermosillo|29.0729|-110.9559
mexico|SON|Ciudad Obregón|27.4828|-109.9304
mexico|SON|Nogales|31.3086|-110.9428
mexico|SON|Guaymas|27.9193|-110.8975
mexico|SON|Navojoa|27.0703|-109.4437
mexico|VER|Veracruz|19.1738|-96.1342
mexico|VER|Xalapa|19.5438|-96.9102
mexico|VER|Coatzacoalcos|18.1492|-94.4350
mexico|VER|Poza Rica|20.5331|-97.4595
mexico|VER|Córdoba|18.8842|-96.9256
mexico|TAB|Villahermosa|17.9892|-92.9281
mexico|TAB|Cárdenas|18.0014|-93.3756
mexico|TAB|Comalcalco|18.2639|-93.2242
mexico|TAB|Paraíso|18.4000|-93.2167
mexico|TAB|Macuspana|17.7606|-92.5953
mexico|CAM|Ciudad del Carmen|18.6539|-91.8075
mexico|CAM|Campeche|19.8301|-90.5349
mexico|CAM|Calkiní|20.3694|-90.0508
mexico|CAM|Champotón|19.3500|-90.7167
mexico|CAM|Escárcega|18.6086|-90.7386
mexico|CMX|Mexico City|19.4326|-99.1332
mexico|CMX|Coyoacán|19.3467|-99.1617
mexico|CMX|Iztapalapa|19.3550|-99.0622
mexico|CMX|Gustavo A. Madero|19.4828|-99.1106
mexico|CMX|Benito Juárez|19.3814|-99.1592
mexico|AGU|Aguascalientes|21.8853|-102.2916
mexico|AGU|Jesús María|21.9611|-102.3436
mexico|AGU|Calvillo|21.8464|-102.7186
mexico|AGU|Rincón de Romos|22.2292|-102.3214
mexico|AGU|Pabellón de Arteaga|22.1486|-102.2764
mexico|BCN|Tijuana|32.5149|-117.0382
mexico|BCN|Mexicali|32.6245|-115.4523
mexico|BCN|Ensenada|31.8667|-116.5964
mexico|BCN|Tecate|32.5728|-116.6292
mexico|BCN|Rosarito|32.3661|-117.0617
mexico|BCS|La Paz|24.1426|-110.3128
mexico|BCS|Cabo San Lucas|22.8905|-109.9167
mexico|BCS|San José del Cabo|23.0594|-109.6977
mexico|BCS|Todos Santos|23.4486|-110.2269
mexico|BCS|Ciudad Constitución|25.0322|-111.6703
mexico|CHP|Tuxtla Gutiérrez|16.7516|-93.1030
mexico|CHP|Tapachula|14.9056|-92.2618
mexico|CHP|San Cristóbal de las Casas|16.7370|-92.6376
mexico|CHP|Comitán|16.2500|-92.1333
mexico|CHP|Palenque|17.5095|-91.9823
mexico|COL|Colima|19.2433|-103.7241
mexico|COL|Manzanillo|19.0522|-104.3158
mexico|COL|Villa de Álvarez|19.2672|-103.7378
mexico|COL|Tecomán|18.9089|-103.8747
mexico|COL|Armería|18.9364|-103.9653
mexico|DUR|Durango|24.0277|-104.6532
mexico|DUR|Gómez Palacio|25.5694|-103.4958
mexico|DUR|Lerdo|25.5369|-103.5242
mexico|DUR|Santiago Papasquiaro|25.0436|-105.4192
mexico|DUR|El Salto|23.7833|-105.3667
mexico|GUA|León|21.1250|-101.6859
mexico|GUA|Irapuato|20.6767|-101.3564
mexico|GUA|Celaya|20.5236|-100.8157
mexico|GUA|Salamanca|20.5739|-101.1919
mexico|GUA|Guanajuato|21.0190|-101.2574
mexico|GRO|Acapulco|16.8531|-99.8237
mexico|GRO|Chilpancingo|17.5506|-99.5058
mexico|GRO|Iguala|18.3450|-99.5397
mexico|GRO|Zihuatanejo|17.6434|-101.5521
mexico|GRO|Taxco|18.5566|-99.6051
mexico|HID|Pachuca|20.1011|-98.7591
mexico|HID|Tulancingo|20.0833|-98.3667
mexico|HID|Tula|20.0536|-99.3428
mexico|HID|Huejutla|21.1397|-98.4194
mexico|HID|Ixmiquilpan|20.4861|-99.2167
mexico|MEX|Toluca|19.2826|-99.6557
mexico|MEX|Ecatepec|19.6018|-99.0506
mexico|MEX|Naucalpan|19.4785|-99.2396
mexico|MEX|Nezahualcóyotl|19.4006|-99.0145
mexico|MEX|Tlalnepantla|19.5401|-99.1954
mexico|MIC|Morelia|19.7060|-101.1950
mexico|MIC|Uruapan|19.4208|-102.0628
mexico|MIC|Zamora|19.9833|-102.2833
mexico|MIC|Lázaro Cárdenas|17.9583|-102.2000
mexico|MIC|Apatzingán|19.0886|-102.3506
mexico|MOR|Cuernavaca|18.9242|-99.2216
mexico|MOR|Jiutepec|18.8814|-99.1778
mexico|MOR|Cuautla|18.8125|-98.9547
mexico|MOR|Temixco|18.8500|-99.2333
mexico|MOR|Yautepec|18.8833|-99.0667
mexico|NAY|Tepic|21.5042|-104.8946
mexico|NAY|Bahía de Banderas|20.8000|-105.3333
mexico|NAY|Santiago Ixcuintla|21.8111|-105.2083
mexico|NAY|Compostela|21.2386|-104.9000
mexico|NAY|Acaponeta|22.4964|-105.3631
mexico|OAX|Oaxaca|17.0732|-96.7266
mexico|OAX|Salina Cruz|16.1756|-95.1944
mexico|OAX|Juchitán|16.4333|-95.0194
mexico|OAX|Tuxtepec|18.0883|-96.1253
mexico|OAX|Puerto Escondido|15.8631|-97.0722
mexico|PUE|Puebla|19.0414|-98.2063
mexico|PUE|Tehuacán|18.4617|-97.3928
mexico|PUE|San Martín Texmelucan|19.2833|-98.4333
mexico|PUE|Atlixco|18.9083|-98.4361
mexico|PUE|Cholula|19.0633|-98.3036
mexico|QUE|Querétaro|20.5888|-100.3899
mexico|QUE|San Juan del Río|20.3881|-99.9961
mexico|QUE|El Marqués|20.6667|-100.2833
mexico|QUE|Corregidora|20.5333|-100.4417
mexico|QUE|Tequisquiapan|20.5206|-99.8956
mexico|ROO|Cancún|21.1619|-86.8515
mexico|ROO|Chetumal|18.5001|-88.2960
mexico|ROO|Playa del Carmen|20.6296|-87.0739
mexico|ROO|Cozumel|20.4229|-86.9223
mexico|ROO|Tulum|20.2114|-87.4654
mexico|SLP|San Luis Potosí|22.1565|-100.9855
mexico|SLP|Soledad|22.1833|-100.9333
mexico|SLP|Ciudad Valles|21.9833|-99.0167
mexico|SLP|Matehuala|23.6528|-100.6444
mexico|SLP|Rioverde|21.9300|-99.9950
mexico|SIN|Culiacán|24.8091|-107.3940
mexico|SIN|Mazatlán|23.2494|-106.4111
mexico|SIN|Los Mochis|25.7935|-108.9860
mexico|SIN|Guasave|25.5672|-108.4678
mexico|SIN|Guamúchil|25.4639|-108.0794
mexico|TLA|Tlaxcala|19.3139|-98.2404
mexico|TLA|Apizaco|19.4136|-98.1433
mexico|TLA|Huamantla|19.3136|-97.9228
mexico|TLA|Chiautempan|19.3167|-98.2000
mexico|TLA|Calpulalpan|19.5886|-98.5708
mexico|YUC|Mérida|20.9674|-89.5926
mexico|YUC|Kanasín|20.9347|-89.5578
mexico|YUC|Valladolid|20.6897|-88.2014
mexico|YUC|Tizimín|21.1425|-88.1647
mexico|YUC|Progreso|21.2833|-89.6667
mexico|ZAC|Zacatecas|22.7709|-102.5832
mexico|ZAC|Fresnillo|23.1753|-102.8677
mexico|ZAC|Guadalupe|22.7528|-102.5186
mexico|ZAC|Jerez|22.6486|-102.9903
mexico|ZAC|Río Grande|23.8278|-103.0306
`.trim()

function citiesFor(countrySlug, stateCode, pairs) {
  return pairs.map(([name, lat, lng]) => `${countrySlug}|${stateCode}|${name}|${lat}|${lng}`).join('\n')
}

const EXTRA_CITIES = [
  citiesFor('guatemala', 'GU', [['Guatemala City', 14.6349, -90.5069], ['Mixco', 14.6333, -90.6064], ['Villa Nueva', 14.5258, -90.5875]]),
  citiesFor('guatemala', 'AV', [['Cobán', 15.4708, -90.3708], ['San Pedro Carchá', 15.4772, -90.3106]]),
  citiesFor('guatemala', 'BV', [['Salamá', 15.1028, -90.3158], ['Rabinal', 15.0833, -90.4833]]),
  citiesFor('guatemala', 'CM', [['Chimaltenango', 14.6611, -90.8194], ['Tecpán', 14.7667, -90.9944]]),
  citiesFor('guatemala', 'CQ', [['Chiquimula', 14.8000, -89.5458], ['Esquipulas', 14.5650, -89.3508]]),
  citiesFor('guatemala', 'PR', [['Guastatoya', 14.8542, -90.0694], ['Sanarate', 14.7903, -90.1922]]),
  citiesFor('guatemala', 'ES', [['Escuintla', 14.3050, -90.7850], ['Santa Lucía Cotzumalguapa', 14.3350, -91.0236]]),
  citiesFor('guatemala', 'HU', [['Huehuetenango', 15.3194, -91.4708], ['La Democracia', 15.6167, -91.8667]]),
  citiesFor('guatemala', 'IZ', [['Puerto Barrios', 15.7278, -88.5944], ['Morales', 15.4833, -88.8167]]),
  citiesFor('guatemala', 'JA', [['Jalapa', 14.6347, -89.9889], ['San Pedro Pinula', 14.6667, -89.8500]]),
  citiesFor('guatemala', 'JU', [['Jutiapa', 14.2917, -89.8958], ['Asunción Mita', 14.3306, -89.7106]]),
  citiesFor('guatemala', 'PE', [['Flores', 16.9297, -89.8917], ['San Benito', 16.9167, -89.9167]]),
  citiesFor('guatemala', 'QZ', [['Quetzaltenango', 14.8347, -91.5181], ['Coatepeque', 14.7000, -91.8667]]),
  citiesFor('guatemala', 'QC', [['Santa Cruz del Quiché', 15.0308, -91.1489], ['Chichicastenango', 14.9436, -91.1108]]),
  citiesFor('guatemala', 'RE', [['Retalhuleu', 14.5361, -91.6778], ['San Sebastián', 14.5667, -91.6500]]),
  citiesFor('guatemala', 'SA', [['Antigua Guatemala', 14.5573, -90.7337], ['Ciudad Vieja', 14.5167, -90.7667]]),
  citiesFor('guatemala', 'SM', [['San Marcos', 14.9639, -91.7944], ['Malacatán', 14.9083, -92.0583]]),
  citiesFor('guatemala', 'SR', [['Cuilapa', 14.2781, -90.2983], ['Barberena', 14.3083, -90.3611]]),
  citiesFor('guatemala', 'SO', [['Sololá', 14.7722, -91.1833], ['Panajachel', 14.7408, -91.1558]]),
  citiesFor('guatemala', 'SU', [['Mazatenango', 14.5333, -91.5031], ['Chicacao', 14.5333, -91.3167]]),
  citiesFor('guatemala', 'TO', [['Totonicapán', 14.9117, -91.3611], ['San Francisco El Alto', 14.9500, -91.4500]]),
  citiesFor('guatemala', 'ZA', [['Zacapa', 14.9719, -89.5308], ['Estanzuela', 14.9972, -89.5722]]),
  citiesFor('belize', 'BZ', [['Belize City', 17.5046, -88.1962], ['San Pedro', 17.9214, -87.9611]]),
  citiesFor('belize', 'CY', [['San Ignacio', 17.1588, -89.0696], ['Belmopan', 17.2510, -88.7590]]),
  citiesFor('belize', 'CZ', [['Corozal', 18.3939, -88.3883], ['Consejo', 18.3667, -88.3167]]),
  citiesFor('belize', 'OW', [['Orange Walk', 18.0753, -88.5583], ['Trial Farm', 18.0667, -88.5500]]),
  citiesFor('belize', 'SC', [['Dangriga', 16.9697, -88.2325], ['Placencia', 16.5142, -88.3664]]),
  citiesFor('belize', 'TO', [['Punta Gorda', 16.1005, -88.8095], ['Big Creek', 16.5167, -88.4000]]),
  citiesFor('honduras', 'AT', [['La Ceiba', 15.7597, -86.7897], ['Tela', 15.7750, -87.4667]]),
  citiesFor('honduras', 'CH', [['Choluteca', 13.3003, -87.1908], ['San Marcos de Colón', 13.4333, -86.8000]]),
  citiesFor('honduras', 'CL', [['Trujillo', 15.9167, -85.9500], ['Tocoa', 15.6833, -86.0000]]),
  citiesFor('honduras', 'CM', [['Comayagua', 14.4603, -87.6375], ['Siguatepeque', 14.6000, -87.8333]]),
  citiesFor('honduras', 'CP', [['Santa Rosa de Copán', 14.7667, -88.7792], ['Copán Ruinas', 14.8333, -89.1500]]),
  citiesFor('honduras', 'CR', [['San Pedro Sula', 15.5000, -88.0333], ['Puerto Cortés', 15.8250, -87.9297]]),
  citiesFor('honduras', 'EP', [['Yuscarán', 13.9444, -86.8500], ['Danlí', 14.0333, -86.5833]]),
  citiesFor('honduras', 'FM', [['Tegucigalpa', 14.0723, -87.1921], ['Comayagüela', 14.0833, -87.2167]]),
  citiesFor('honduras', 'GD', [['Puerto Lempira', 15.2667, -83.7717], ['Ahuas', 15.4833, -84.3333]]),
  citiesFor('honduras', 'IN', [['La Esperanza', 14.3111, -88.1806], ['Intibucá', 14.3167, -88.1667]]),
  citiesFor('honduras', 'IB', [['Roatán', 16.3244, -86.5369], ['Utila', 16.1000, -86.9000]]),
  citiesFor('honduras', 'LP', [['La Paz', 14.3167, -87.6833], ['Marcala', 14.1500, -88.0333]]),
  citiesFor('honduras', 'LE', [['Gracias', 14.5833, -88.5833], ['La Iguala', 14.6333, -88.4667]]),
  citiesFor('honduras', 'OC', [['Nueva Ocotepeque', 14.4333, -89.1833], ['Sinuapa', 14.4500, -89.1833]]),
  citiesFor('honduras', 'OL', [['Juticalpa', 14.6667, -86.2167], ['Catacamas', 14.8500, -85.9000]]),
  citiesFor('honduras', 'SB', [['Santa Bárbara', 14.9167, -88.2333], ['Trinidad', 15.1333, -88.2333]]),
  citiesFor('honduras', 'VA', [['Nacaome', 13.5333, -87.4833], ['San Lorenzo', 13.4242, -87.4472]]),
  citiesFor('honduras', 'YO', [['Yoro', 15.1333, -87.1333], ['El Progreso', 15.4000, -87.8000]]),
  citiesFor('el-salvador', 'SS', [['San Salvador', 13.6929, -89.2182], ['Soyapango', 13.7100, -89.1400], ['Mejicanos', 13.7403, -89.2131]]),
  citiesFor('el-salvador', 'SA', [['Santa Ana', 13.9942, -89.5597], ['Metapán', 14.3333, -89.4500]]),
  citiesFor('el-salvador', 'SM', [['San Miguel', 13.4833, -88.1833], ['Ciudad Barrios', 13.7667, -88.2667]]),
  citiesFor('el-salvador', 'LI', [['Santa Tecla', 13.6769, -89.2797], ['La Libertad', 13.4883, -89.3222]]),
  citiesFor('el-salvador', 'SO', [['Sonsonate', 13.7186, -89.7242], ['Acajutla', 13.5928, -89.8275]]),
  citiesFor('el-salvador', 'AH', [['Ahuachapán', 13.9214, -89.8450], ['Atiquizaya', 13.9769, -89.7525]]),
  citiesFor('el-salvador', 'US', [['Usulután', 13.3500, -88.4500], ['Santiago de María', 13.4833, -88.4667]]),
  citiesFor('el-salvador', 'PA', [['Zacatecoluca', 13.5000, -88.8667], ['San Luis Talpa', 13.4667, -89.0833]]),
  citiesFor('el-salvador', 'UN', [['La Unión', 13.3369, -87.8439], ['Santa Rosa de Lima', 13.6247, -87.8936]]),
  citiesFor('el-salvador', 'CH', [['Chalatenango', 14.0333, -88.9333], ['Nueva Concepción', 14.1333, -89.2833]]),
  citiesFor('el-salvador', 'CU', [['Cojutepeque', 13.7167, -88.9333], ['Suchitoto', 13.9381, -89.0278]]),
  citiesFor('el-salvador', 'SV', [['San Vicente', 13.6333, -88.8000], ['Tecoluca', 13.5333, -88.7833]]),
  citiesFor('el-salvador', 'MO', [['San Francisco Gotera', 13.7000, -88.1000], ['Sociedad', 13.6833, -88.0167]]),
  citiesFor('el-salvador', 'CA', [['Sensuntepeque', 13.8667, -88.6333], ['Ilobasco', 13.8500, -88.8500]]),
  citiesFor('nicaragua', 'MN', [['Managua', 12.1364, -86.2514], ['Ciudad Sandino', 12.1583, -86.3442], ['Tipitapa', 12.1972, -86.0969]]),
  citiesFor('nicaragua', 'LE', [['León', 12.4344, -86.8778], ['La Paz Centro', 12.3400, -86.6750]]),
  citiesFor('nicaragua', 'CI', [['Chinandega', 12.6294, -87.1311], ['El Viejo', 12.6636, -87.1667]]),
  citiesFor('nicaragua', 'MS', [['Masaya', 11.9744, -86.0942], ['Nindirí', 12.0000, -86.1167]]),
  citiesFor('nicaragua', 'GR', [['Granada', 11.9344, -85.9560], ['Nandaime', 11.7500, -86.0500]]),
  citiesFor('nicaragua', 'ES', [['Estelí', 13.0919, -86.3539], ['Condega', 13.3667, -86.4000]]),
  citiesFor('nicaragua', 'MT', [['Matagalpa', 12.9256, -85.9175], ['Sébaco', 12.8500, -86.1000]]),
  citiesFor('nicaragua', 'JI', [['Jinotega', 13.0910, -86.0023], ['San Rafael del Norte', 13.2000, -86.1167]]),
  citiesFor('nicaragua', 'CA', [['Jinotepe', 11.8500, -86.2000], ['Diriamba', 11.8581, -86.2392]]),
  citiesFor('nicaragua', 'RI', [['Rivas', 11.4372, -85.8263], ['San Juan del Sur', 11.2529, -85.8705]]),
  citiesFor('nicaragua', 'CO', [['Juigalpa', 12.1000, -85.3667], ['Santo Tomás', 12.0667, -85.0833]]),
  citiesFor('nicaragua', 'BO', [['Boaco', 12.4722, -85.6586], ['Camoapa', 12.3833, -85.5167]]),
  citiesFor('nicaragua', 'NS', [['Ocotal', 13.6333, -86.4833], ['Jalapa', 13.9167, -86.1333]]),
  citiesFor('nicaragua', 'MD', [['Somoto', 13.4833, -86.5833], ['Palacagüina', 13.4667, -86.4000]]),
  citiesFor('nicaragua', 'RS', [['San Carlos', 11.1236, -84.7778], ['El Castillo', 11.0167, -84.4000]]),
  citiesFor('nicaragua', 'CN', [['Puerto Cabezas', 14.0347, -83.3833], ['Waspam', 14.7417, -83.9717]]),
  citiesFor('nicaragua', 'CS', [['Bluefields', 12.0137, -83.7635], ['El Rama', 12.1597, -84.2197]]),
  citiesFor('costa-rica', 'SJ', [['San José', 9.9281, -84.0907], ['Desamparados', 9.8986, -84.0669], ['Escazú', 9.9186, -84.1397]]),
  citiesFor('costa-rica', 'A', [['Alajuela', 10.0162, -84.2116], ['San Ramón', 10.0872, -84.4703], ['Grecia', 10.0742, -84.3114]]),
  citiesFor('costa-rica', 'C', [['Cartago', 9.8636, -83.9166], ['Turrialba', 9.9047, -83.6836], ['Paraíso', 9.8381, -83.8656]]),
  citiesFor('costa-rica', 'H', [['Heredia', 9.9981, -84.1169], ['San Isidro', 10.0167, -84.0500]]),
  citiesFor('costa-rica', 'G', [['Liberia', 10.6350, -85.4377], ['Nicoya', 10.1447, -85.4522]]),
  citiesFor('costa-rica', 'P', [['Puntarenas', 9.9763, -84.8384], ['Quepos', 9.4319, -84.1614]]),
  citiesFor('costa-rica', 'L', [['Limón', 9.9907, -83.0359], ['Guápiles', 10.2167, -83.7833]]),
  citiesFor('panama', 'PA', [['Panama City', 8.9824, -79.5199], ['San Miguelito', 9.0333, -79.5000]]),
  citiesFor('panama', 'PO', [['La Chorrera', 8.8803, -79.7833], ['Arraiján', 8.9500, -79.6500]]),
  citiesFor('panama', 'CL', [['Colón', 9.3592, -79.9014], ['Portobelo', 9.5547, -79.6553]]),
  citiesFor('panama', 'CH', [['David', 8.4273, -82.4308], ['Boquete', 8.7800, -82.4333]]),
  citiesFor('panama', 'CC', [['Penonomé', 8.5167, -80.3500], ['Aguadulce', 8.2422, -80.5444]]),
  citiesFor('panama', 'HE', [['Chitré', 7.9606, -80.4286], ['Parita', 8.0000, -80.5167]]),
  citiesFor('panama', 'LS', [['Las Tablas', 7.7667, -80.2833], ['Pedasí', 7.5333, -80.0333]]),
  citiesFor('panama', 'VE', [['Santiago', 8.1000, -80.9833], ['Soná', 8.0167, -81.3167]]),
  citiesFor('panama', 'BT', [['Bocas del Toro', 9.3403, -82.2417], ['Changuinola', 9.4300, -82.5200]]),
  citiesFor('panama', 'DA', [['La Palma', 8.4067, -78.1400], ['Yaviza', 8.1500, -77.6833]]),
  citiesFor('dominican-republic', 'DN', [['Santo Domingo', 18.4861, -69.9312], ['Gazcue', 18.4700, -69.9100]]),
  citiesFor('dominican-republic', 'SD', [['Santo Domingo Este', 18.4886, -69.8578], ['Boca Chica', 18.4500, -69.6000]]),
  citiesFor('dominican-republic', 'ST', [['Santiago de los Caballeros', 19.4517, -70.6970], ['Licey al Medio', 19.4333, -70.6000]]),
  citiesFor('dominican-republic', 'PP', [['Puerto Plata', 19.7934, -70.6884], ['Sosúa', 19.7528, -70.5194]]),
  citiesFor('dominican-republic', 'AL', [['Higüey', 18.6150, -68.7075], ['Punta Cana', 18.5601, -68.3725]]),
  citiesFor('dominican-republic', 'RO', [['La Romana', 18.4273, -68.9728], ['Guaymate', 18.5833, -68.9667]]),
  citiesFor('dominican-republic', 'SC', [['San Cristóbal', 18.4167, -70.1000], ['Bajos de Haina', 18.4153, -70.0331]]),
  citiesFor('dominican-republic', 'VE', [['La Vega', 19.2222, -70.5296], ['Jarabacoa', 19.1167, -70.6333]]),
  citiesFor('dominican-republic', 'SM', [['Samaná', 19.2056, -69.3364], ['Las Terrenas', 19.3110, -69.5428]]),
  citiesFor('dominican-republic', 'BH', [['Barahona', 18.2085, -71.1008], ['Cabral', 18.2500, -71.2167]]),
  citiesFor('dominican-republic', 'PM', [['San Pedro de Macorís', 18.4539, -69.3086], ['Consuelo', 18.5500, -69.3000]]),
  citiesFor('dominican-republic', 'DU', [['San Francisco de Macorís', 19.3000, -70.2500], ['Pimentel', 19.1833, -70.1667]]),
  citiesFor('dominican-republic', 'AZ', [['Azua', 18.4531, -70.7347], ['Peralta', 18.5833, -70.7667]]),
  citiesFor('dominican-republic', 'MC', [['Monte Cristi', 19.8500, -71.6500], ['Guayubín', 19.6833, -71.4000]]),
  citiesFor('dominican-republic', 'VA', [['Mao', 19.5519, -71.0781], ['Esperanza', 19.5833, -70.9833]]),
  citiesFor('dominican-republic', 'ES', [['Moca', 19.3936, -70.5256], ['Gaspar Hernández', 19.6333, -70.2833]]),
  citiesFor('dominican-republic', 'MT', [['Nagua', 19.3833, -69.8500], ['Cabrera', 19.6333, -69.9000]]),
  citiesFor('dominican-republic', 'SR', [['Cotuí', 19.0500, -70.1500], ['Fantino', 19.1167, -70.3000]]),
  citiesFor('dominican-republic', 'MN', [['Bonao', 18.9369, -70.4092], ['Maimón', 18.8833, -70.3167]]),
  citiesFor('dominican-republic', 'HM', [['Hato Mayor', 18.7628, -69.2569], ['Sabana de la Mar', 19.0667, -69.3833]]),
  citiesFor('dominican-republic', 'SE', [['El Seibo', 18.7653, -69.0350], ['Miches', 18.9833, -69.0500]]),
  citiesFor('dominican-republic', 'MP', [['Monte Plata', 18.8070, -69.7840], ['Bayaguana', 18.7500, -69.6333]]),
  citiesFor('dominican-republic', 'PV', [['Baní', 18.2797, -70.3319], ['Nizao', 18.2500, -70.2167]]),
  citiesFor('dominican-republic', 'SJ', [['San Juan', 18.8056, -71.2297], ['Las Matas de Farfán', 18.8667, -71.5167]]),
  citiesFor('dominican-republic', 'JO', [['San José de Ocoa', 18.5467, -70.5064], ['Sabana Larga', 18.5833, -70.4833]]),
  citiesFor('dominican-republic', 'PN', [['Pedernales', 18.0378, -71.7440], ['Oviedo', 17.8000, -71.4000]]),
  citiesFor('dominican-republic', 'IN', [['Jimaní', 18.4914, -71.8508], ['Duvergé', 18.3667, -71.5167]]),
  citiesFor('dominican-republic', 'BR', [['Neiba', 18.4833, -71.4167], ['Galván', 18.5000, -71.3333]]),
  citiesFor('dominican-republic', 'DA', [['Dajabón', 19.5488, -71.7083], ['Loma de Cabrera', 19.4167, -71.6167]]),
  citiesFor('dominican-republic', 'EP', [['Comendador', 19.0000, -71.7000], ['Hondo Valle', 18.7167, -71.6833]]),
  citiesFor('dominican-republic', 'SZ', [['Sabaneta', 19.4833, -71.3500], ['Monción', 19.4167, -71.1667]]),
  citiesFor('dominican-republic', 'MI', [['Salcedo', 19.3778, -70.4178], ['Tenares', 19.3667, -70.3500]]),
  citiesFor('trinidad-and-tobago', 'POS', [['Port of Spain', 10.6603, -61.5086], ['Woodbrook', 10.6667, -61.5167]]),
  citiesFor('trinidad-and-tobago', 'SFO', [['San Fernando', 10.2797, -61.4683], ['Marabella', 10.3000, -61.4500]]),
  citiesFor('trinidad-and-tobago', 'CHA', [['Chaguanas', 10.5167, -61.4167], ['Cunupia', 10.5500, -61.3833]]),
  citiesFor('trinidad-and-tobago', 'ARI', [['Arima', 10.6374, -61.2823], ['Malabar', 10.6333, -61.2667]]),
  citiesFor('trinidad-and-tobago', 'PTF', [['Point Fortin', 10.1744, -61.6842], ['Guapo', 10.1833, -61.7000]]),
  citiesFor('trinidad-and-tobago', 'DMN', [['Diego Martin', 10.7200, -61.5667], ['Westmoorings', 10.6833, -61.5500]]),
  citiesFor('trinidad-and-tobago', 'SJL', [['San Juan', 10.6500, -61.4500], ['Laventille', 10.6500, -61.4833]]),
  citiesFor('trinidad-and-tobago', 'TUP', [['Tunapuna', 10.6500, -61.3833], ['Piarco', 10.5953, -61.3372]]),
  citiesFor('trinidad-and-tobago', 'SGE', [['Sangre Grande', 10.5872, -61.1300], ['Valencia', 10.6500, -61.2000]]),
  citiesFor('trinidad-and-tobago', 'CTT', [['Couva', 10.4231, -61.4672], ['Tabaquite', 10.3833, -61.3000]]),
  citiesFor('trinidad-and-tobago', 'PRT', [['Princes Town', 10.2718, -61.3712], ['Williamsville', 10.3167, -61.3667]]),
  citiesFor('trinidad-and-tobago', 'PED', [['Penal', 10.1667, -61.4500], ['Debe', 10.2000, -61.4500]]),
  citiesFor('trinidad-and-tobago', 'SIP', [['Siparia', 10.1453, -61.5072], ['Fyzabad', 10.1833, -61.5167]]),
  citiesFor('trinidad-and-tobago', 'MRC', [['Mayaro', 10.2833, -61.0167], ['Rio Claro', 10.3056, -61.1750]]),
  citiesFor('trinidad-and-tobago', 'TOB', [['Scarborough', 11.1833, -60.7333], ['Crown Point', 11.1497, -60.8364]]),
].join('\n')

const allCityLines = `${CITY_LINES}\n${EXTRA_CITIES}`
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)

const seen = new Set()
const cities = []
for (const line of allCityLines) {
  const [countrySlug, stateCode, name, lat, lng] = line.split('|')
  const key = `${countrySlug}|${stateCode}|${slugify(name)}`
  if (seen.has(key)) continue
  seen.add(key)
  cities.push({ countrySlug, stateCode, name, lat, lng, slug: slugify(name) })
}

const perCountry = new Map()
function bump(slug, kind) {
  if (!perCountry.has(slug)) perCountry.set(slug, { states: 0, cities: 0 })
  perCountry.get(slug)[kind] += 1
}

for (const state of MEXICO_STATES) bump('mexico', 'states')
for (const c of NEW_COUNTRIES) {
  for (const _s of c.states) bump(c.slug, 'states')
}
for (const city of cities) bump(city.countrySlug, 'cities')

const values = cities
  .map((c, i) => `  (${sqlStr(c.countrySlug)}, ${sqlStr(c.stateCode)}, ${sqlStr(c.name)}, ${sqlStr(c.slug)}, ${c.lat}, ${c.lng}, ${i + 1})`)
  .join(',\n')

const mexicoStatesSql = MEXICO_STATES
  .map(s => `    (v_region_id, ${sqlStr(s[0])}, ${sqlStr(s[1])}, ${s[2]}, ${s[3]})`)
  .join(',\n')

let countrySql = ''
for (const c of NEW_COUNTRIES) {
  const stateRows = c.states
    .map(s => `    (v_region_id, ${sqlStr(s[0])}, ${sqlStr(s[1])}, ${s[2]}, ${s[3]})`)
    .join(',\n')
  countrySql += `
insert into public.countries (name, slug, iso_code) values
  (${sqlStr(c.name)}, ${sqlStr(c.slug)}, ${sqlStr(c.iso)})
on conflict (slug) do update set name = excluded.name, iso_code = excluded.iso_code;

do $$
declare
  v_country_id uuid;
  v_region_id uuid;
begin
  select id into v_country_id from public.countries where slug = ${sqlStr(c.slug)};
  insert into public.regions (country_id, name, slug) values
    (v_country_id, ${sqlStr(c.name)}, ${sqlStr(c.slug)})
  on conflict (country_id, slug) do update set name = excluded.name
  returning id into v_region_id;

  insert into public.states (region_id, name, code, latitude, longitude) values
${stateRows}
  on conflict (region_id, name) do update set
    code = excluded.code,
    latitude = excluded.latitude,
    longitude = excluded.longitude;
end $$;
`
}

const sql = `-- North America location expansion.
-- Mexico states, Central America and Caribbean countries (Canada-style pass-through region), and cities.
-- Generated by scripts/generate-location-seed.mjs — do not edit by hand.

do $$
declare
  v_country_id uuid;
  v_region_id uuid;
begin
  select id into v_country_id from public.countries where slug = 'mexico';
  insert into public.regions (country_id, name, slug) values
    (v_country_id, 'Mexico', 'mexico')
  on conflict (country_id, slug) do update set name = excluded.name
  returning id into v_region_id;

  insert into public.states (region_id, name, code, latitude, longitude) values
${mexicoStatesSql}
  on conflict (region_id, name) do update set
    code = excluded.code,
    latitude = excluded.latitude,
    longitude = excluded.longitude;
end $$;
${countrySql}
insert into public.cities (state_id, name, slug, latitude, longitude, sort_order)
select s.id, v.name, v.slug, v.lat, v.lng, v.sort_order
from (values
${values}
) as v(country_slug, state_code, name, slug, lat, lng, sort_order)
join public.countries c on c.slug = v.country_slug
join public.regions r on r.country_id = c.id
join public.states s on s.region_id = r.id and s.code = v.state_code
on conflict (state_id, slug) do update set
  name = excluded.name,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  sort_order = excluded.sort_order;

-- Backfill city_id from location_city within the listing's state. Unmatched text stays.
update public.listings l
set city_id = c.id
from public.cities c
where l.city_id is null
  and l.state_id is not null
  and l.location_city is not null
  and btrim(l.location_city) <> ''
  and c.state_id = l.state_id
  and lower(translate(btrim(l.location_city), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))
    = lower(translate(c.name, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'));
`

const out = join(root, 'supabase/migrations/seed_north_america_locations.sql')
writeFileSync(out, sql)

const counts = [...perCountry.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
console.log('cities', cities.length)
for (const [slug, row] of counts) {
  console.log(`${slug}\tstates=${row.states}\tcities=${row.cities}`)
}
const byState = new Map()
for (const city of cities) {
  const key = `${city.countrySlug}|${city.stateCode}`
  byState.set(key, (byState.get(key) ?? 0) + 1)
}
const thin = [...byState.entries()].filter(([, n]) => n < 2)
if (thin.length) {
  console.log('subdivisions with fewer than 2 cities:', thin.map(([k, n]) => `${k}:${n}`).join(', '))
}
