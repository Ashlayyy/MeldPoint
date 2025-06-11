import { computed } from 'vue';

export const disabled = (step: number, maxSteps: number) => {
  return computed(() => {
    return step === 0 ? 'prev' : step === maxSteps ? 'next' : undefined;
  });
};

export const disabledDates = () => {
  return computed(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return {
      to: date
    };
  });
};
