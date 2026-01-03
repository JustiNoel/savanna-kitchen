// Food images
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

export const foodImages: Record<string, string> = {
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
};

export const getImageForDish = (dishName: string): string | undefined => {
  const normalizedName = dishName.toLowerCase();
  
  if (normalizedName.includes('nyama choma') || normalizedName.includes('grilled')) {
    return foodImages['nyama-choma'];
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
  if (normalizedName.includes('mandazi')) {
    return foodImages['mandazi'];
  }
  if (normalizedName.includes('mukimo')) {
    return foodImages['mukimo'];
  }
  if (normalizedName.includes('tilapia') || normalizedName.includes('fish')) {
    return foodImages['tilapia'];
  }
  if (normalizedName.includes('matoke')) {
    return foodImages['matoke'];
  }
  if (normalizedName.includes('kachumbari') || normalizedName.includes('salad')) {
    return foodImages['kachumbari'];
  }
  if (normalizedName.includes('chai') || normalizedName.includes('tea')) {
    return foodImages['chai'];
  }
  
  return undefined;
};
