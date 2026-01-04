// Food images - Original Kenyan dishes
import nyamaChoma from '@/assets/food/nyama-choma.jpg';
import pilau from '@/assets/food/pilau.jpg';
import ugaliSukuma from '@/assets/food/ugali-sukuma.jpg';
import chapati from '@/assets/food/chapati.jpg';
import githeri from '@/assets/food/githeri.jpg';
import samosas from '@/assets/food/samosas.jpg';
import mandazi from '@/assets/food/mandazi.jpg';
import mukimo from '@/assets/food/mukimo.jpg';
import tilapia from '@/assets/food/tilapia.jpg';
import matoke from '@/assets/food/matoke.jpg';
import kachumbari from '@/assets/food/kachumbari.jpg';
import chai from '@/assets/food/chai.jpg';

// Pan-African dishes
import jollofRice from '@/assets/food/jollof-rice.jpg';
import suya from '@/assets/food/suya.jpg';
import injeraDoro from '@/assets/food/injera-doro-wat.jpg';
import egusiSoup from '@/assets/food/egusi-soup.jpg';
import fufuGroundnut from '@/assets/food/fufu-groundnut.jpg';
import bobotie from '@/assets/food/bobotie.jpg';
import bunnyChow from '@/assets/food/bunny-chow.jpg';
import thieboudienne from '@/assets/food/thieboudienne.jpg';
import piriPiri from '@/assets/food/piri-piri-chicken.jpg';
import koshari from '@/assets/food/koshari.jpg';
import mafe from '@/assets/food/mafe.jpg';
import ndole from '@/assets/food/ndole.jpg';

// More Kenyan & East African dishes
import friedPlantains from '@/assets/food/fried-plantains.jpg';
import akara from '@/assets/food/akara.jpg';
import puffPuff from '@/assets/food/puff-puff.jpg';
import waliNazi from '@/assets/food/wali-nazi.jpg';
import mishkaki from '@/assets/food/mishkaki.jpg';
import mchuziSamaki from '@/assets/food/mchuzi-samaki.jpg';
import irio from '@/assets/food/irio.jpg';
import kukuPaka from '@/assets/food/kuku-paka.jpg';
import biriani from '@/assets/food/biriani.jpg';
import maharagwe from '@/assets/food/maharagwe.jpg';
import mahamri from '@/assets/food/mahamri.jpg';
import bhajia from '@/assets/food/bhajia.jpg';
import kaimati from '@/assets/food/kaimati.jpg';
import viaziKarai from '@/assets/food/viazi-karai.jpg';
import mbaazi from '@/assets/food/mbaazi.jpg';
import mbuziChoma from '@/assets/food/mbuzi-choma.jpg';
import kunde from '@/assets/food/kunde.jpg';
import mutura from '@/assets/food/mutura.jpg';
import sima from '@/assets/food/sima.jpg';
import uji from '@/assets/food/uji.jpg';
import maziwaMala from '@/assets/food/maziwa-mala.jpg';
import passionJuice from '@/assets/food/passion-juice.jpg';
import tangawizi from '@/assets/food/tangawizi.jpg';
import maandaziMayai from '@/assets/food/maandazi-mayai.jpg';
import nyoyo from '@/assets/food/nyoyo.jpg';
import ndengu from '@/assets/food/ndengu.jpg';
import madafu from '@/assets/food/madafu.jpg';
import kashata from '@/assets/food/kashata.jpg';
import vitumbua from '@/assets/food/vitumbua.jpg';
import sossi from '@/assets/food/sossi.jpg';
import mokimoNyama from '@/assets/food/mokimo-nyama.jpg';
import omena from '@/assets/food/omena.jpg';
import chipsMayai from '@/assets/food/chips-mayai.jpg';
import mangoJuice from '@/assets/food/mango-juice.jpg';
import avocadoSmoothie from '@/assets/food/avocado-smoothie.jpg';
import hibiscusTea from '@/assets/food/hibiscus-tea.jpg';
import mabuyu from '@/assets/food/mabuyu.jpg';
import halwa from '@/assets/food/halwa.jpg';

export const foodImages: Record<string, string> = {
  // Original dishes
  'nyama-choma': nyamaChoma,
  'pilau': pilau,
  'ugali-sukuma': ugaliSukuma,
  'chapati': chapati,
  'githeri': githeri,
  'samosas': samosas,
  'mandazi': mandazi,
  'mukimo': mukimo,
  'tilapia': tilapia,
  'matoke': matoke,
  'kachumbari': kachumbari,
  'chai': chai,
  
  // Pan-African dishes
  'jollof-rice': jollofRice,
  'suya': suya,
  'injera-doro-wat': injeraDoro,
  'egusi-soup': egusiSoup,
  'fufu-groundnut': fufuGroundnut,
  'bobotie': bobotie,
  'bunny-chow': bunnyChow,
  'thieboudienne': thieboudienne,
  'piri-piri-chicken': piriPiri,
  'koshari': koshari,
  'mafe': mafe,
  'ndole': ndole,
  
  // East African dishes
  'fried-plantains': friedPlantains,
  'akara': akara,
  'puff-puff': puffPuff,
  'wali-nazi': waliNazi,
  'mishkaki': mishkaki,
  'mchuzi-samaki': mchuziSamaki,
  'irio': irio,
  'kuku-paka': kukuPaka,
  'biriani': biriani,
  'maharagwe': maharagwe,
  'mahamri': mahamri,
  'bhajia': bhajia,
  'kaimati': kaimati,
  'viazi-karai': viaziKarai,
  'mbaazi': mbaazi,
  'mbuzi-choma': mbuziChoma,
  'kunde': kunde,
  'mutura': mutura,
  'sima': sima,
  'uji': uji,
  'maziwa-mala': maziwaMala,
  'passion-juice': passionJuice,
  'tangawizi': tangawizi,
  'maandazi-mayai': maandaziMayai,
  'nyoyo': nyoyo,
  'ndengu': ndengu,
  'madafu': madafu,
  'kashata': kashata,
  'vitumbua': vitumbua,
  'sossi': sossi,
  'mokimo-nyama': mokimoNyama,
  'omena': omena,
  'chips-mayai': chipsMayai,
  'mango-juice': mangoJuice,
  'avocado-smoothie': avocadoSmoothie,
  'hibiscus-tea': hibiscusTea,
  'mabuyu': mabuyu,
  'halwa': halwa,
};

export const getImageForDish = (dishName: string): string | undefined => {
  const normalizedName = dishName.toLowerCase().replace(/\s+/g, '-');
  
  // Direct match first
  if (foodImages[normalizedName]) {
    return foodImages[normalizedName];
  }
  
  // Keyword matching
  if (normalizedName.includes('nyama') && normalizedName.includes('choma')) {
    return foodImages['nyama-choma'];
  }
  if (normalizedName.includes('mbuzi') && normalizedName.includes('choma')) {
    return foodImages['mbuzi-choma'];
  }
  if (normalizedName.includes('pilau')) {
    return foodImages['pilau'];
  }
  if (normalizedName.includes('ugali') || normalizedName.includes('sukuma')) {
    return foodImages['ugali-sukuma'];
  }
  if (normalizedName.includes('chapati')) {
    return foodImages['chapati'];
  }
  if (normalizedName.includes('githeri')) {
    return foodImages['githeri'];
  }
  if (normalizedName.includes('samosa')) {
    return foodImages['samosas'];
  }
  if (normalizedName.includes('mandazi') && !normalizedName.includes('mayai')) {
    return foodImages['mandazi'];
  }
  if (normalizedName.includes('mukimo') && !normalizedName.includes('nyama')) {
    return foodImages['mukimo'];
  }
  if (normalizedName.includes('tilapia') || (normalizedName.includes('fish') && !normalizedName.includes('curry'))) {
    return foodImages['tilapia'];
  }
  if (normalizedName.includes('matoke')) {
    return foodImages['matoke'];
  }
  if (normalizedName.includes('kachumbari')) {
    return foodImages['kachumbari'];
  }
  if (normalizedName.includes('chai') || normalizedName.includes('tea')) {
    return foodImages['chai'];
  }
  if (normalizedName.includes('jollof')) {
    return foodImages['jollof-rice'];
  }
  if (normalizedName.includes('suya')) {
    return foodImages['suya'];
  }
  if (normalizedName.includes('injera') || normalizedName.includes('doro')) {
    return foodImages['injera-doro-wat'];
  }
  if (normalizedName.includes('egusi')) {
    return foodImages['egusi-soup'];
  }
  if (normalizedName.includes('fufu') || normalizedName.includes('groundnut')) {
    return foodImages['fufu-groundnut'];
  }
  if (normalizedName.includes('bobotie')) {
    return foodImages['bobotie'];
  }
  if (normalizedName.includes('bunny')) {
    return foodImages['bunny-chow'];
  }
  if (normalizedName.includes('piri')) {
    return foodImages['piri-piri-chicken'];
  }
  if (normalizedName.includes('koshari')) {
    return foodImages['koshari'];
  }
  if (normalizedName.includes('biriani') || normalizedName.includes('biryani')) {
    return foodImages['biriani'];
  }
  if (normalizedName.includes('kuku') && normalizedName.includes('paka')) {
    return foodImages['kuku-paka'];
  }
  if (normalizedName.includes('mchuzi') || normalizedName.includes('samaki')) {
    return foodImages['mchuzi-samaki'];
  }
  if (normalizedName.includes('passion')) {
    return foodImages['passion-juice'];
  }
  if (normalizedName.includes('mango') && normalizedName.includes('juice')) {
    return foodImages['mango-juice'];
  }
  if (normalizedName.includes('avocado')) {
    return foodImages['avocado-smoothie'];
  }
  if (normalizedName.includes('hibiscus')) {
    return foodImages['hibiscus-tea'];
  }
  
  return undefined;
};
