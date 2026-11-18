import { useLibrary } from '../context/LibraryContext.jsx';

export default function Toast() {
  const { toastMsg } = useLibrary();
  if (!toastMsg) return null;
  return (
    <div className="toast" role="status">
      {toastMsg}
    </div>
  );
}
