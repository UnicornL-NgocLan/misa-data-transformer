import { useZustand } from '../zustand'

const useCheckRights = () => {
  const { auth, accessGroups, rights } = useZustand()

  const isActionValid = (object, action, rights) => {
    const respectiveRights = rights.filter(
      (i) => i.objectId.name.toString() === object.toString()
    )
    let isValid = true
    for (let i = 0; i < action.length; i++) {
      isValid = respectiveRights.some((item) => item[action[i]])
      if (!isValid) break
    }
    return isValid
  }

  const checkRights = (object, action) => {
    if (auth.role === 'admin') return true

    const belongingGroups = accessGroups.filter((i) =>
      i.userIds.find((item) => item.toString() === auth._id.toString())
    )

    const relatedRights = rights.filter((i) =>
      belongingGroups.find((item) => item._id === i.accessGroupId)
    )

    return isActionValid(object, action, relatedRights)
  }

  return checkRights
}

export default useCheckRights
