const { prompt, MultiSelect } = require('enquirer')

const getInput = async (name, message) => {
  return prompt({
    type: 'input',
    name,
    message,
  })
}

module.exports = { getInput }
