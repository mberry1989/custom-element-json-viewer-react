import { FC, useEffect, useState } from 'react';
import { createDeliveryClient } from '@kontent-ai/delivery-sdk';

export const IntegrationApp: FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [elementValue, setElementValue] = useState<string | null>(null);
  const [itemCodename, setItemCodename] = useState<string | null>(null);

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isConfig(element.config)) {
        throw new Error('Invalid configuration of the custom element. Please check the documentation.');
      }

      setConfig(element.config);
      setProjectId(context.projectId);
      setElementValue(element.value ?? '');
      setItemCodename(context.item.codename);
    });
  }, []);

  useEffect(() => {
    CustomElement.setHeight(800);
  }, []);

  const getFileJSON = async () => {
    if(!config){
      return null;
    }

    if(projectId && itemCodename){
     // initialize delivery client
     const deliveryClient = createDeliveryClient({
      environmentId: projectId || '',
      previewApiKey: process.env.REACT_APP_PREVIEW_KEY || '',
        defaultQueryConfig: {
          usePreviewMode: true
        }
    })

    const assetArr = await deliveryClient.item(itemCodename)
      .depthParameter(0)
      .elementsParameter([config.dataElementCodename])
      .toPromise()

    const file = assetArr.data.item.elements[config.dataElementCodename]?.value[0].url

    const results = () => {fetch(file)
      .then(response => response.json())
      .then(json => setElementValue(json))
      .catch(error => console.error(error));
    }
    results();
    }
  }

  if (!config || !projectId || elementValue === null) {
    return null;
  }

  return (
    <>
      <section>
        <button onClick={getFileJSON}>View Export JSON</button>
      </section>
      <section>
        <pre>{JSON.stringify(elementValue, null, 2)}</pre>
      </section>
    </>
  );
};

IntegrationApp.displayName = 'IntegrationApp';

type Config = Readonly<{
  // expected custom element's configuration
  dataElementCodename: string;
}>;

// check it is the expected configuration
const isConfig = (v: unknown): v is Config =>
  isObject(v) &&
  hasProperty(nameOf<Config>('dataElementCodename'), v) &&
  typeof v.dataElementCodename === 'string';

const hasProperty = <PropName extends string, Input extends {}>(propName: PropName, v: Input): v is Input & { [key in PropName]: unknown } =>
  v.hasOwnProperty(propName);

const isObject = (v: unknown): v is {} =>
  typeof v === 'object' &&
  v !== null;

const nameOf = <Obj extends Readonly<Record<string, unknown>>>(prop: keyof Obj) => prop;
