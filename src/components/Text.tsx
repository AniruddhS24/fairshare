import PropTypes from 'prop-types';

const Text = ({type = 'body', children, className = '' }) => {
  const types = {
    xl_heading: 'text-4xl font-bold text-darkest',
    m_heading: 'text-2xl font-bold text-darkest',
    s_heading: 'text-lg font-bold text-darkest',
    body_bold: 'text-base font-bold text-darkest',
    body_semi: 'text-base font-medium text-darkest',
    body: 'text-base font-normal text-midgray',
    body_bold: 'text-base font-bold',
    button: 'text-lg font-bold text-white',
  };
  const headingFormat = types[type] || types.body;

  return (
    <h1 className={`${headingFormat} ${className}`}>
      {children}
    </h1>
  );
};

Text.propTypes = {
  type: PropTypes.oneOf(['xl_heading', 'm_heading', 's_heading', 'body_bold', 'body_semi', 'body', 'body_bold', 'button']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,  // Allow custom Tailwind classes to be passed
};

export default Text;
