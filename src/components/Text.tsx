import PropTypes from 'prop-types';

const Text = ({type = 'none', children, className = '' }) => {
  const types = {
    xl_heading: 'text-4xl font-bold',
    m_heading: 'text-2xl font-bold',
    s_heading: 'text-lg font-bold',
    body_bold: 'text-base font-bold',
    body_semi: 'text-base font-medium',
    body: 'text-base font-normal',
    none: '',
  };
  const headingFormat = types[type] || types.none;

  return (
    <span className={`${className} ${headingFormat}`}>
      {children}
    </span>
  );
};

Text.propTypes = {
  type: PropTypes.oneOf(['xl_heading', 'm_heading', 's_heading', 'body_bold', 'body_semi', 'body', 'button']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,  // Allow custom Tailwind classes to be passed
};

export default Text;
