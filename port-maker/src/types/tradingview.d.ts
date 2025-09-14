// TradingView type definitions
declare namespace TradingView {
  interface WidgetOptions {
    symbol: string;
    interval: string;
    container_id: string;
    width?: string | number;
    height?: string | number;
    timezone?: string;
    theme?: 'light' | 'dark';
    style?: string | number;
    locale?: string;
    toolbar_bg?: string;
    enable_publishing?: boolean;
    allow_symbol_change?: boolean;
    disabled_features?: string[];
    enabled_features?: string[];
    studies?: string[];
    drawings_access?: any;
    show_popup_button?: boolean;
    popup_width?: string;
    popup_height?: string;
    referral_id?: string;
    hide_side_toolbar?: boolean;
    save_image?: boolean;
    studies_overrides?: any;
    overrides?: any;
    // Charting library specific options
    datafeed?: any;
    library_path?: string;
    charts_storage_url?: string;
    charts_storage_api_version?: string;
    client_id?: string;
    user_id?: string;
    fullscreen?: boolean;
    autosize?: boolean;
  }

  interface IChartingLibraryWidget {
    onChartReady(callback: () => void): void;
    chart(): IChartApi;
    setSymbol(symbol: string, interval: string, callback?: () => void): void;
    remove(): void;
  }

  interface IChartApi {
    createShape(point: any, options: any): any;
    removeEntity(entityId: any): void;
    createStudy(name: string, forceOverlay: boolean, lock: boolean, inputs: any[], callback?: (studyId: any) => void): void;
    executeActionById(actionId: string): void;
    getShapeById(shapeId: string): any;
    getVisibleRange(): { from: number; to: number; } | null;
    resolution(): string | null;
    timeToCoordinate(time: number): number | null;
    priceToCoordinate(price: number): number | null;
    symbol(): string | null;
  }

  class widget implements IChartingLibraryWidget {
    constructor(options: WidgetOptions);
    onChartReady(callback: () => void): void;
    chart(): IChartApi;
    setSymbol(symbol: string, interval: string, callback?: () => void): void;
    remove(): void;
  }
}

declare global {
  interface Window {
    TradingView: typeof TradingView;
  }
}
