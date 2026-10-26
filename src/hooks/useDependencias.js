import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { generateId, normalizeStr } from '../utils/helpers';
import { conSello } from '../services/syncBienes';
import { DEPENDENCIAS_UNP } from '../constants/appConstants';

/**
 * Hook de dominio: dependencias, ubicaciones y catálogos de la UNP.
 *
 * Extraído de App.jsx (Fase de modularización). Centraliza las escrituras
 * sobre `dependencias`, `ubicaciones` y sus cascadas en `bens`,
 * `funcionarios`, `fc10`, `fc11` y `fc04`.
 *
 * @param {Object} params
 * @param {boolean} params.isAuthenticated - ¿Hay sesión activa?
 * @param {string} params.dependenciaActual - Dependencia seleccionada
 * @param {Function} params.setDependenciaActual - Cambiar dependencia activa
 * @param {Function} params.clearAllFilters - Limpiar filtros de inventario
 * @param {Function} params.setActiveTab - Cambiar pestaña del shell
 * @param {Function} params.notify - addToast
 * @param {Array} params.bienes - Lista de bienes locales
 * @param {Function} params.setBienes - Setter de bienes
 * @param {Array} params.funcionariosPadron - Padrón de funcionarios
 * @param {Function} params.setFuncionariosPadron - Setter de padrón
 * @param {Array} params.fc10List - Actas FC-10
 * @param {Function} params.setFc10List - Setter FC-10
 * @param {Array} params.fc11List - Actas FC-11
 * @param {Function} params.setFc11List - Setter FC-11
 * @param {Array} params.fc04List - Actas FC-04
 * @param {Function} params.setFc04List - Setter FC-04
 * @returns {Object} Estados y acciones de dependencias/ubicaciones
 */
export function useDependencias({
  isAuthenticated,
  dependenciaActual,
  setDependenciaActual,
  clearAllFilters,
  setActiveTab,
  notify,
  bienes,
  setBienes,
  funcionariosPadron,
  setFuncionariosPadron,
  fc10List,
  setFc10List,
  fc11List,
  setFc11List,
  fc04List,
  setFc04List,
}) {
  const addToast = notify;

  // --- Dependencias ---

  const [dependenciasList, setDependenciasList] = useState([]);
  const [isDependenciasModalOpen, setIsDependenciasModalOpen] = useState(false);
  const [isSavingDep, setIsSavingDep] = useState(false);

  const fetchDependencias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dependencias')
        .select('*')
        .order('nombre');
      if (!error && data) setDependenciasList(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDependencias();
  }, [isAuthenticated, fetchDependencias]);

  const todasDependencias = useMemo(() => {
    const deTabla = dependenciasList.filter((d) => d.activa !== false).map((d) => d.nombre);
    return deTabla.length > 0 ? deTabla : DEPENDENCIAS_UNP;
  }, [dependenciasList]);

  const guardarDependencia = async (id, nombre, codigo = '', activa = true) => {
    setIsSavingDep(true);
    try {
      if (!id) {
        const row = { id: generateId(), nombre: nombre.trim(), codigo: codigo.trim(), activa: true };
        const { error } = await supabase.from('dependencias').insert([row]);
        if (error) throw error;
        setDependenciasList((prev) =>
          [...prev, row].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
        );
        addToast(`Dependencia "${nombre}" agregada.`, 'success');
      } else {
        const anterior = dependenciasList.find((d) => d.id === id);
        if (!anterior) return;
        const { error } = await supabase
          .from('dependencias')
          .update({ nombre: nombre.trim(), codigo: codigo.trim(), activa })
          .eq('id', id);
        if (error) throw error;

        if (normalizeStr(anterior.nombre) !== normalizeStr(nombre)) {
          const nuevo = nombre.trim();
          const renombrar = async (lista, tabla, campo, setLista, esJSON) => {
            const afectados = lista.filter(
              (r) => normalizeStr(r[campo] || '') === normalizeStr(anterior.nombre)
            );
            const usarSello = tabla === 'bens' && esJSON;
            let fallos = 0;
            for (let i = 0; i < afectados.length; i += 10) {
              const chunk = afectados.slice(i, i + 10);
              const res = await Promise.all(
                chunk.map((r) => {
                  const datos = { ...r, [campo]: nuevo };
                  const payload = esJSON
                    ? usarSello
                      ? conSello({ data: datos })
                      : { data: datos }
                    : { [campo]: nuevo };
                  const q = supabase.from(tabla).update(payload);
                  return r.id ? q.eq('id', r.id) : q.eq('username', r.username);
                })
              );
              fallos += res.filter((x) => x && x.error).length;
            }
            if (afectados.length > 0 && fallos === 0) {
              const ids = new Set(afectados.map((r) => r.id || r.username));
              setLista((prev) =>
                prev.map((r) =>
                  (ids.has(r.id) || ids.has(r.username)) ? { ...r, [campo]: nuevo } : r
                )
              );
            }
            return fallos > 0 ? -fallos : afectados.length;
          };

          const n1 = await renombrar(bienes, 'bens', 'dependencia', setBienes, true);
          const n2 = await renombrar(
            funcionariosPadron,
            'funcionarios',
            'dependencia',
            setFuncionariosPadron,
            false
          );
          const n3 = await renombrar(
            ubicacionesListRef.current,
            'ubicaciones',
            'dependencia',
            setUbicacionesList,
            false
          );
          const n4 = await renombrar(fc10List, 'fc10', 'dependencia', setFc10List, true);
          const n5 = await renombrar(
            fc11List,
            'fc11',
            'dependenciaRemitente',
            setFc11List,
            true
          );
          const n6 = await renombrar(fc04List, 'fc04', 'dependencia', setFc04List, true);

          if (normalizeStr(dependenciaActual) === normalizeStr(anterior.nombre)) {
            setDependenciaActual(nuevo);
            clearAllFilters();
          }

          const nFallos = [n1, n2, n3, n4, n5, n6].reduce(
            (s, n) => s + (n < 0 ? -n : 0),
            0
          );
          const nOk = [n1, n2, n3, n4, n5, n6].reduce((s, n) => s + (n > 0 ? n : 0), 0);
          if (nFallos > 0) {
            addToast(
              `Dependencia renombrada, pero ${nFallos} registros no se pudieron migrar. Revisá los datos de esa dependencia.`,
              'error'
            );
          } else {
            addToast(`Dependencia actualizada (${nOk} registros migrados).`, 'success');
          }
        }

        setDependenciasList((prev) =>
          prev
            .map((d) =>
              d.id === id ? { ...d, nombre: nombre.trim(), activa } : d
            )
            .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
        );
      }
    } catch {
      addToast('No se pudo guardar. Verifica la tabla dependencias en Supabase.', 'error');
    } finally {
      setIsSavingDep(false);
    }
  };

  const fusionarDependencia = async (origenNombre, destinoNombre) => {
    setIsSavingDep(true);
    try {
      const mover = async (lista, tabla, campo, setLista, esJSON) => {
        const afectados = lista.filter(
          (r) => normalizeStr(r[campo] || '') === normalizeStr(origenNombre)
        );
        for (let i = 0; i < afectados.length; i += 10) {
          const chunk = afectados.slice(i, i + 10);
          await Promise.all(
            chunk.map((r) => {
              const payload = esJSON
                ? { data: { ...r, [campo]: destinoNombre } }
                : { [campo]: destinoNombre };
              const q = supabase.from(tabla).update(payload);
              return r.id ? q.eq('id', r.id) : q.eq('username', r.username);
            })
          );
        }
        if (afectados.length > 0) {
          const ids = new Set(afectados.map((r) => r.id || r.username));
          setLista((prev) =>
            prev.map((r) =>
              (ids.has(r.id) || ids.has(r.username)) ? { ...r, [campo]: destinoNombre } : r
            )
          );
        }
        return afectados.length;
      };

      const total =
        (await mover(bienes, 'bens', 'dependencia', setBienes, true)) +
        (await mover(funcionariosPadron, 'funcionarios', 'dependencia', setFuncionariosPadron, false)) +
        (await mover(
          ubicacionesListRef.current,
          'ubicaciones',
          'dependencia',
          setUbicacionesList,
          false
        )) +
        (await mover(fc10List, 'fc10', 'dependencia', setFc10List, true)) +
        (await mover(fc11List, 'fc11', 'dependenciaRemitente', setFc11List, true)) +
        (await mover(fc04List, 'fc04', 'dependencia', setFc04List, true));

      if (normalizeStr(dependenciaActual) === normalizeStr(origenNombre)) {
        setDependenciaActual(destinoNombre);
        clearAllFilters();
      }
      addToast(`"${origenNombre}" fusionada en "${destinoNombre}" (${total} registros).`, 'success');
    } catch {
      addToast('No se pudo fusionar.', 'error');
    } finally {
      setIsSavingDep(false);
    }
  };

  const eliminarDependencia = async (id, nombre) => {
    const todasListas = [
      bienes,
      funcionariosPadron,
      ubicacionesListRef.current,
      fc10List,
      fc11List,
      fc04List,
    ];
    const hay = todasListas.some((lista) =>
      lista.some((r) => normalizeStr(r.dependencia || r.dependenciaRemitente || '') === normalizeStr(nombre))
    );
    if (hay) {
      addToast('Tiene registros asociados. Fusiona o reasigna antes de eliminar.', 'warning');
      return;
    }
    try {
      const { error } = await supabase.from('dependencias').delete().eq('id', id);
      if (error) throw error;
      setDependenciasList((prev) => prev.filter((d) => d.id !== id));
      addToast('Dependencia eliminada.', 'success');
    } catch {
      addToast('No se pudo eliminar.', 'error');
    }
  };

  const verPadronDependencia = useCallback(
    (nombre) => {
      setDependenciaActual(nombre);
      clearAllFilters();
      setIsDependenciasModalOpen(false);
      setActiveTab('funcionarios');
      addToast(`Entorno cambiado a ${nombre}`, 'success');
    },
    [setDependenciaActual, clearAllFilters, setIsDependenciasModalOpen, setActiveTab, addToast]
  );

  const asignarFuncionarioAUbicacion = async (funcId, ubicacionNombre) => {
    if (!funcId) return;
    try {
      const func = funcionariosPadron.find((f) => f.id === funcId);
      const { error } = await supabase
        .from('funcionarios')
        .update({ ubicacion: ubicacionNombre || '' })
        .eq('id', funcId);
      if (error) throw error;
      setFuncionariosPadron((prev) =>
        prev.map((f) => (f.id === funcId ? { ...f, ubicacion: ubicacionNombre || '' } : f))
      );

      let movidos = 0;
      if (ubicacionNombre && func) {
        const cedFunc = String(func.cedula || '').replace(/\D/g, '');
        const nomFunc = normalizeStr(func.nombre || '');
        const afectados = bienes.filter((b) => {
          if (b.dependencia !== dependenciaActual) return false;
          if (normalizeStr(b.ubicacion || '') === normalizeStr(ubicacionNombre)) return false;
          const cedBien = String(b.funcionarioDoc || '').replace(/\D/g, '');
          if (cedFunc && cedBien && cedFunc === cedBien) return true;
          return nomFunc && normalizeStr(b.funcionario || '') === nomFunc;
        });
        for (const b of afectados) {
          const actualizado = { ...b, ubicacion: ubicacionNombre };
          const { error: eBien } = await supabase
            .from('bens')
            .update(conSello({ data: actualizado }))
            .eq('id', b.id);
          if (!eBien) movidos++;
        }
        if (movidos > 0) {
          const ids = new Set(afectados.map((b) => b.id));
          setBienes((prev) =>
            prev.map((b) => (ids.has(b.id) ? { ...b, ubicacion: ubicacionNombre } : b))
          );
        }
      }
      addToast(
        ubicacionNombre
          ? movidos > 0
            ? `Funcionario asignado. ${movidos} bien(es) actualizados.`
            : 'Funcionario asignado a la ubicación.'
          : 'Funcionario sin ubicación.',
        'success'
      );
    } catch {
      addToast('No se pudo asignar.', 'error');
    }
  };

  // --- Ubicaciones ---

  const [ubicacionesList, setUbicacionesList] = useState([]);
  // Ref para lecturas sincrónicas dentro de closures async (guardar/fusionar dependencia)
  const ubicacionesListRef = useRef(ubicacionesList);
  ubicacionesListRef.current = ubicacionesList;

  const [isUbicacionesModalOpen, setIsUbicacionesModalOpen] = useState(false);
  const [isSavingUbicacion, setIsSavingUbicacion] = useState(false);

  const fetchUbicaciones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ubicaciones')
        .select('*')
        .order('nombre');
      if (!error && data) setUbicacionesList(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchUbicaciones();
  }, [isAuthenticated, fetchUbicaciones]);

  const ubicacionesDep = useMemo(
    () => ubicacionesList.filter((u) => u.dependencia === dependenciaActual).map((u) => u.nombre),
    [ubicacionesList, dependenciaActual]
  );

  const conteosUbicacion = useMemo(() => {
    const mapa = {};
    ubicacionesDep.forEach((n) => {
      mapa[n] = { bienes: 0, funcionarios: 0 };
    });
    bienes
      .filter((b) => b.dependencia === dependenciaActual)
      .forEach((b) => {
        const hit = ubicacionesDep.find(
          (n) => normalizeStr(n) === normalizeStr(b.ubicacion || '')
        );
        if (hit) mapa[hit].bienes++;
      });
    funcionariosPadron
      .filter((f) => f.dependencia === dependenciaActual)
      .forEach((f) => {
        const hit = ubicacionesDep.find(
          (n) => normalizeStr(n) === normalizeStr(f.ubicacion || '')
        );
        if (hit) mapa[hit].funcionarios++;
      });
    return mapa;
  }, [ubicacionesDep, bienes, funcionariosPadron, dependenciaActual]);

  const guardarUbicacion = async (id, nombre, dependencia = dependenciaActual) => {
    setIsSavingUbicacion(true);
    try {
      if (!id) {
        const row = { id: generateId(), nombre, dependencia };
        const { error } = await supabase.from('ubicaciones').insert([row]);
        if (error) throw error;
        setUbicacionesList((prev) =>
          [...prev, row].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
        );
        addToast(`Ubicación "${nombre}" agregada.`, 'success');
      } else {
        const anterior = ubicacionesList.find((u) => u.id === id);
        if (!anterior || normalizeStr(anterior.nombre) === normalizeStr(nombre)) return;
        const { error } = await supabase.from('ubicaciones').update({ nombre }).eq('id', id);
        if (error) throw error;

        const bienesAfectados = bienes.filter(
          (b) => normalizeStr(b.ubicacion || '') === normalizeStr(anterior.nombre)
        );
        for (let i = 0; i < bienesAfectados.length; i += 10) {
          const chunk = bienesAfectados.slice(i, i + 10);
          await Promise.all(
            chunk.map((b) =>
              supabase
                .from('bens')
                .update(conSello({ data: { ...b, ubicacion: nombre } }))
                .eq('id', b.id)
            )
          );
        }
        if (bienesAfectados.length > 0) {
          const ids = new Set(bienesAfectados.map((b) => b.id));
          setBienes((prev) =>
            prev.map((b) => (ids.has(b.id) ? { ...b, ubicacion: nombre } : b))
          );
        }
        const funcAfectados = funcionariosPadron.filter(
          (f) => normalizeStr(f.ubicacion || '') === normalizeStr(anterior.nombre)
        );
        for (const f of funcAfectados) {
          await supabase.from('funcionarios').update({ ubicacion: nombre }).eq('id', f.id);
        }
        if (funcAfectados.length > 0) {
          const ids = new Set(funcAfectados.map((f) => f.id));
          setFuncionariosPadron((prev) =>
            prev.map((f) => (ids.has(f.id) ? { ...f, ubicacion: nombre } : f))
          );
        }
        setUbicacionesList((prev) =>
          prev
            .map((u) => (u.id === id ? { ...u, nombre } : u))
            .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
        );
        addToast(
          `Ubicación actualizada en ${bienesAfectados.length} bienes y ${funcAfectados.length} funcionarios.`,
          'success'
        );
      }
    } catch {
      addToast('No se pudo guardar. Verifica la tabla ubicaciones en Supabase.', 'error');
    } finally {
      setIsSavingUbicacion(false);
    }
  };

  const eliminarUbicacion = async (id, nombre) => {
    const enBienes = bienes.filter(
      (b) => b.dependencia === dependenciaActual && normalizeStr(b.ubicacion || '') === normalizeStr(nombre)
    ).length;
    const enFunc = funcionariosPadron.filter(
      (f) => f.dependencia === dependenciaActual && normalizeStr(f.ubicacion || '') === normalizeStr(nombre)
    ).length;
    if (enBienes > 0 || enFunc > 0) {
      addToast(`En uso: ${enBienes} bienes y ${enFunc} funcionarios. Reasigna primero.`, 'warning');
      return;
    }
    try {
      const { error } = await supabase.from('ubicaciones').delete().eq('id', id);
      if (error) throw error;
      setUbicacionesList((prev) => prev.filter((u) => u.id !== id));
      addToast('Ubicación eliminada.', 'success');
    } catch {
      addToast('No se pudo eliminar.', 'error');
    }
  };

  // --- Memos derivados ---

  const dependenciasDetectadas = useMemo(() => {
    const oficiales = new Set(todasDependencias.map((d) => normalizeStr(d)));
    const mapa = new Map();
    const contar = (dep, tipo) => {
      const nombre = String(dep || '').trim();
      if (!nombre || oficiales.has(normalizeStr(nombre))) return;
      if (!mapa.has(nombre)) mapa.set(nombre, { nombre, bienes: 0, funcionarios: 0 });
      mapa.get(nombre)[tipo]++;
    };
    bienes.forEach((b) => contar(b.dependencia, 'bienes'));
    funcionariosPadron.forEach((f) => contar(f.dependencia, 'funcionarios'));
    return [...mapa.values()].sort(
      (a, b) => (b.bienes + b.funcionarios) - (a.bienes + a.funcionarios)
    );
  }, [bienes, funcionariosPadron, todasDependencias]);

  const conteosDependencia = useMemo(() => {
    const mapa = {};
    todasDependencias.forEach((n) => {
      mapa[n] = { bienes: 0, funcionarios: 0, ubicaciones: 0 };
    });
    bienes.forEach((b) => {
      const hit = todasDependencias.find(
        (n) => normalizeStr(n) === normalizeStr(b.dependencia || '')
      );
      if (hit) mapa[hit].bienes++;
    });
    funcionariosPadron.forEach((f) => {
      const hit = todasDependencias.find(
        (n) => normalizeStr(n) === normalizeStr(f.dependencia || '')
      );
      if (hit) mapa[hit].funcionarios++;
    });
    ubicacionesList.forEach((u) => {
      if (u.dependencia && mapa[u.dependencia]) mapa[u.dependencia].ubicaciones++;
    });
    return mapa;
  }, [todasDependencias, bienes, funcionariosPadron, ubicacionesList]);

  return {
    // Dependencias
    dependenciasList,
    setDependenciasList,
    isDependenciasModalOpen,
    setIsDependenciasModalOpen,
    isSavingDep,
    fetchDependencias,
    todasDependencias,
    guardarDependencia,
    fusionarDependencia,
    eliminarDependencia,
    verPadronDependencia,
    asignarFuncionarioAUbicacion,
    // Ubicaciones
    ubicacionesList,
    setUbicacionesList,
    isUbicacionesModalOpen,
    setIsUbicacionesModalOpen,
    isSavingUbicacion,
    fetchUbicaciones,
    ubicacionesDep,
    conteosUbicacion,
    guardarUbicacion,
    eliminarUbicacion,
    // Derivados
    dependenciasDetectadas,
    conteosDependencia,
  };
}
