
const BackButton = (props) => {
  const {
    gotoPage
  } = props
  return (
    <div className="mt-6">
      <button
        onClick={() => { gotoPage('/admin') }}
        className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center space-x-2"
      >
        <span>{`Back to main page`}</span>
      </button>
    </div>
  );
};

export default BackButton;