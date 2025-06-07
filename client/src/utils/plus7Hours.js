export const add7Hours = (time) => {
  const newDate = new Date(time)
  return new Date(
    newDate.setTime(newDate.getTime() + 7 * 60 * 60 * 1000)
  ).toISOString()
}
