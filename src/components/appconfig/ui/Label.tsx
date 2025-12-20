

export default function Label(props) {
  const { children } = props
  
  return (
    <label className="block text-gray-200 mb-2 font-bold mb-1 mt-2 -label">{children}</label>
  )
}