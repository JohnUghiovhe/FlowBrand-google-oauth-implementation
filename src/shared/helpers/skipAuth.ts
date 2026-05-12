export const skipAuth = () => {
  return (_target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('skip-auth', true, descriptor.value);
    return descriptor;
  };
};
