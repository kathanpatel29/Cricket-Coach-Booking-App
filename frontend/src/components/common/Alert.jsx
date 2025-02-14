const Alert = ({ type = 'info', message }) => {
    const styles = {
      success: 'bg-green-100 border-green-500 text-green-700',
      error: 'bg-red-100 border-red-500 text-red-700',
      info: 'bg-blue-100 border-blue-500 text-blue-700',
      warning: 'bg-yellow-100 border-yellow-500 text-yellow-700'
    };
  
    return (
      <div className={`${styles[type]} border-l-4 p-4 mb-4 rounded`}>
        {message}
      </div>
    );
  };
  
  export default Alert;