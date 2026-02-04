export const VOD_CATEGORIES = [
  { value: 'inside_gylf', label: 'Inside GYLF' },
  { value: 'echoes_of_truth', label: 'Echoes of Truth' },
  { value: 'beyond_the_surface', label: 'Beyond The Surface' },
  { value: 'the_commission', label: 'The Commission' },
  { value: 'talent_express', label: 'Talent Express' },
  { value: 'fit_and_fab', label: 'Fit and Fab' },
  { value: 'hi_tech', label: 'Hi-Tech' },
  { value: 'precious_words', label: 'Precious Words' },
  { value: 'my_encounter', label: 'My Encounter' },
  { value: 'fashion_and_style', label: 'Fashion & Style' },
  { value: 'live_your_best', label: 'Live Your Best' },
  { value: 'young_achievers', label: 'Young Achievers' },
  { value: 'ipreach', label: 'iPreach' },
  { value: 'my_salvation_story', label: 'My Salvation Story' },
  { value: 'a_voice_that_must_be_heard', label: 'A Voice that Must be Heard' },
  { value: 'missions_field_diaries', label: 'Missions Field Diaries' },
] as const;

export type VodCategory = typeof VOD_CATEGORIES[number]['value'];

export const getCategoryLabel = (value: string): string => {
  const category = VOD_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
};

export const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
