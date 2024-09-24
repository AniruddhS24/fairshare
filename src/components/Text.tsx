import PropTypes from 'prop-types';

const Text = ({type = 'body', children, className = '' }) => {
  const types = {
    xl_heading: 'text-4xl font-bold text-darkest',
    m_heading: 'text-2xl font-bold text-darkest',
    body_bold: 'text-base font-bold text-darkest',
    body_semi: 'text-base font-semibold text-darkest',
    body: 'text-base font-normal text-midgray',
    s_body: 'text-base font-bold',
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
  type: PropTypes.oneOf(['xl_heading', 'm_heading', 'body_bold', 'body_semi', 'body', 's_body', 'button']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,  // Allow custom Tailwind classes to be passed
};

export default Text;
