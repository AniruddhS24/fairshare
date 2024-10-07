import PropTypes from 'prop-types';

const Text = ({type = 'none', children, className = '' }) => {
  const types = {
    xl_heading: 'text-4xl font-bold text-darkest',
    m_heading: 'text-2xl font-bold text-darkest',
    s_heading: 'text-lg font-bold text-darkest',
    body_bold: 'text-base font-bold text-darkest',
    body_semi: 'text-base font-medium text-darkest',
    body_semi_custom: 'text-base font-medium',
    body: 'text-base font-normal text-midgray',
    body_dark: 'text-base font-normal text-darkest',
    body_bold: 'text-base font-bold',
    button: 'text-lg font-bold text-white',
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
  type: PropTypes.oneOf(['xl_heading', 'm_heading', 's_heading', 'body_bold', 'body_semi', 'body', 'body_dark', 'body_bold', 'button']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,  // Allow custom Tailwind classes to be passed
};

export default Text;
