import { FC, useCallback, useEffect, useState } from 'react';
import { createDeliveryClient } from '@kontent-ai/delivery-sdk';

export const IntegrationApp: FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [itemName, setItemName] = useState<string | null>(null);
  const [watchedElementValue, setWatchedElementValue] = useState<string | null>(null);
  const [elementValue, setElementValue] = useState<string | null>(null);
  const [itemCodename, setItemCodename] = useState<string | null>(null);

  const updateWatchedElementValue = useCallback((codename: string) => {
    CustomElement.getElementValue(codename, v => typeof v === 'string' && setWatchedElementValue(v));
  }, []);

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isConfig(element.config)) {
        throw new Error('Invalid configuration of the custom element. Please check the documentation.');
      }

      setConfig(element.config);
      setProjectId(context.projectId);
      setIsDisabled(element.disabled);
      setItemName(context.item.name);
      setElementValue(element.value ?? '');
      updateWatchedElementValue(element.config.textElementCodename);
      setItemCodename(context.item.codename);
    });
  }, [updateWatchedElementValue]);

  useEffect(() => {
    CustomElement.setHeight(500);
  }, []);

  useEffect(() => {
    CustomElement.onDisabledChanged(setIsDisabled);
  }, []);

  useEffect(() => {
    CustomElement.observeItemChanges(i => setItemName(i.name));
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }
    CustomElement.observeElementChanges([config.textElementCodename], () => updateWatchedElementValue(config.textElementCodename));
  }, [config, updateWatchedElementValue]);

  const getFileJSON = async () => {
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
      .elementsParameter(['export_data'])
      .toPromise()

    const file = assetArr.data.item.elements['export_data']?.value[0].url


    const results = () => {fetch(file)
      .then(response => response.json())
      .then(json => setElementValue(json))
      .catch(error => console.error(error));
    }
    results();
    }
  }

  const updateValue = (newValue: string) => {
    CustomElement.setValue(newValue);
    setElementValue(newValue);
  };

  if (!config || !projectId || elementValue === null || watchedElementValue === null || itemName === null) {
    return null;
  }

  return (
    <>
      <section>
        get asset JSON
        <button onClick={getFileJSON}>Select different items</button>
      </section>
      <section>
        <input value={elementValue} onChange={e => updateValue(e.target.value)} disabled={isDisabled} />
      </section>
    </>
  );
};

IntegrationApp.displayName = 'IntegrationApp';

type Config = Readonly<{
  // expected custom element's configuration
  textElementCodename: string;
}>;

// check it is the expected configuration
const isConfig = (v: unknown): v is Config =>
  isObject(v) &&
  hasProperty(nameOf<Config>('textElementCodename'), v) &&
  typeof v.textElementCodename === 'string';

const hasProperty = <PropName extends string, Input extends {}>(propName: PropName, v: Input): v is Input & { [key in PropName]: unknown } =>
  v.hasOwnProperty(propName);

const isObject = (v: unknown): v is {} =>
  typeof v === 'object' &&
  v !== null;

const nameOf = <Obj extends Readonly<Record<string, unknown>>>(prop: keyof Obj) => prop;
