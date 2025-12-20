import React, { useState } from "react";
import FaIcon from '@/components/FaIcon'

const Input = (props) => {
  const {
    value,
    setValue = () => {},
    onBlur,
    onFocus,
    error, 
    errorMessage,
    disabled,
    hasLink,
    readOnly = false,
    buttons,
    type = "text"
  } = props
  
  return (
    <div className=" w-full flex items-center space-x-2 -input">
      <div className="relative flex-1">
        <input
          type={type}
          value={value}
          onBlur={onBlur}
          onFocus={onFocus}
          readOnly={readOnly}
          onChange={(e) => { if (!disabled) { setValue(e.target.value) }}}
          className={`w-full px-4 py-2 ${(disabled || readOnly) ? 'bg-gray-300 text-gray-600 border-gray-500' : 'bg-white text-black'} border rounded focus:outline-none ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        {hasLink && (
          <div className={`absolute flex items-center top-2 right-2 bottom-2 pr-1 pl-1 ${(disabled || readOnly) ? 'bg-gray-300' : 'bg-white'}`}>
            <a
              href={hasLink}
              target={`_blank`}
              className="text-blue-500"
            >
              <FaIcon icon="up-right-from-square" />
            </a>
          </div>
        )}
        {/* Сообщение об ошибке */}
        {error && errorMessage && (
          <div
            className="absolute bottom-full left-0 w-full bg-red-200 border-red-500 border text-red-800 p-1 pr-2 pl-2"
          >
            {errorMessage}
          </div>
        )}
      </div>
      {buttons && (
        <>{buttons}</>
      )}
    </div>
  );
};

export default Input;