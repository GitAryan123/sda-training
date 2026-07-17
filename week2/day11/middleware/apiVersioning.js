const express = require('express');
const { AppError } = require('./errorHandler');

const supportedVersions = ['v1', 'v2'];
const defaultVersion = 'v1';

const apiVersioning = (req, res, next) => {
  // Extract version from URL path
  const versionMatch = req.path.match(/^\/api\/(v\d+)/);
  const urlVersion = versionMatch ? versionMatch[1] : null;
  
  // Extract version from Accept header
  const acceptHeader = req.headers.accept || '';
  const headerVersion = acceptHeader.includes('version=') 
    ? acceptHeader.split('version=')[1].split(',')[0]
    : null;
  
  // Determine API version
  const apiVersion = urlVersion || headerVersion || defaultVersion;
  
  // Validate version
  if (!supportedVersions.includes(apiVersion)) {
    return next(new AppError(
      `API version ${apiVersion} is not supported. Supported versions: ${supportedVersions.join(', ')}`,
      400
    ));
  }
  
  req.apiVersion = apiVersion;
  next();
};

const versionSpecificRoutes = (version) => {
  return (req, res, next) => {
    req.versionSpecificRoutes = version;
    next();
  };
};

module.exports = { apiVersioning, versionSpecificRoutes };