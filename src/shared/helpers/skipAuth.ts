export const skipAuth = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('skip-auth', true, descriptor.value);
    return descriptor;
  };
};
